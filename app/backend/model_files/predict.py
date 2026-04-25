import torch
import pandas as pd
from torch_geometric.loader import DataLoader
from pathlib import Path
from dotenv import load_dotenv
from mp_api.client import MPRester
from pymatgen.analysis.phase_diagram import PDEntry, PhaseDiagram
from pymatgen.core import Composition
from pymatgen.core import Structure
from .dataset import GNoMEDataset
from .model import CGCNNRegressorStrong
import os

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)
MP_API_KEY = os.getenv("MP_API_KEY")
THERMO_TYPES = ["GGA_GGA+U"]
STABLE_EHULL_TOL = 1e-6
_phase_diagram_cache: dict[str, PhaseDiagram] = {}

model = CGCNNRegressorStrong(
    num_embeddings = 100,
    atom_emb_dim = 64,
    edge_dim = 50,
    hidden_dim = 128,
    num_conv_layers = 4,
    dropout = 0.1,
).to(device)

model_path = Path(__file__).resolve().parent / "model_config.pt"

# --- FIX START ---
checkpoint = torch.load(model_path, map_location=device)

# Extract the model weights from the dictionary
if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
    model.load_state_dict(checkpoint['model_state_dict'])
    # Store normalization constants for later use
    target_mean = checkpoint.get('target_mean', 0.0)
    target_std = checkpoint.get('target_std', 1.0)
else:
    model.load_state_dict(checkpoint)
    target_mean, target_std = 0.0, 1.0
# --- FIX END ---

model.eval()


def extract_material_metadata(structure: Structure, material_id: str) -> dict:
    composition = structure.composition
    lattice = structure.lattice
    elements = sorted({str(element) for element in composition.elements})

    return {
        "material_id": material_id,
        "formula": composition.formula,
        "reduced_formula": composition.reduced_formula,
        "chemical_system": "-".join(elements),
        "element_count": len(elements),
        "num_sites": len(structure),
        "volume_angstrom3": structure.volume,
        "density_g_cm3": float(structure.density),
        "lattice_a": lattice.a,
        "lattice_b": lattice.b,
        "lattice_c": lattice.c,
        "lattice_alpha": lattice.alpha,
        "lattice_beta": lattice.beta,
        "lattice_gamma": lattice.gamma,
    }


def get_phase_diagram(elements: list[str]) -> PhaseDiagram:
    chemsys_key = "-".join(sorted(elements))
    if chemsys_key in _phase_diagram_cache:
        return _phase_diagram_cache[chemsys_key]

    if not MP_API_KEY:
        raise RuntimeError("MP_API_KEY is not set.")

    with MPRester(MP_API_KEY) as mpr:
        entries = mpr.get_entries_in_chemsys(
            elements=sorted(elements),
            additional_criteria={"thermo_types": THERMO_TYPES},
        )

    if not entries:
        raise RuntimeError(f"No Materials Project entries returned for chemical system {chemsys_key}.")

    phase_diagram = PhaseDiagram(entries)
    _phase_diagram_cache[chemsys_key] = phase_diagram
    return phase_diagram


def get_predicted_hull_data(structure: Structure, predicted_formation_energy_per_atom: float) -> dict:
    elements = [str(element) for element in structure.composition.elements]
    phase_diagram = get_phase_diagram(elements)
    fractional_composition = structure.composition.fractional_composition

    reference_energy_per_atom = 0.0
    for element, fraction in fractional_composition.items():
        reference_energy_per_atom += fraction * phase_diagram.get_reference_energy_per_atom(
            Composition(str(element))
        )

    predicted_total_energy_per_atom = predicted_formation_energy_per_atom + reference_energy_per_atom
    predicted_total_energy = predicted_total_energy_per_atom * structure.composition.num_atoms

    candidate_entry = PDEntry(
        composition=structure.composition,
        energy=predicted_total_energy,
        name=structure.composition.reduced_formula,
    )

    decomposition, energy_above_hull = phase_diagram.get_decomp_and_e_above_hull(
        candidate_entry,
        on_error="ignore",
    )

    phase_separation_energy = None
    if energy_above_hull is None:
        decomposition, phase_separation_energy = phase_diagram.get_decomp_and_phase_separation_energy(
            candidate_entry,
            stable_only=False,
            on_error="ignore",
        )
        if phase_separation_energy is not None:
            if phase_separation_energy <= 0:
                energy_above_hull = 0.0
            else:
                energy_above_hull = phase_separation_energy

    decomposition_summary = ""
    if decomposition:
        decomposition_summary = " + ".join(
            f"{amount:.4f} {entry.composition.reduced_formula}"
            for entry, amount in decomposition.items()
        )

    if energy_above_hull is None:
        raise RuntimeError(
            f"No valid hull energy could be computed for {structure.composition.reduced_formula}."
        )

    is_stable = energy_above_hull is not None and abs(energy_above_hull) <= STABLE_EHULL_TOL
    stability_note = None
    if phase_separation_energy is not None and phase_separation_energy < 0:
        stability_note = (
            "Predicted entry lies below the current Materials Project hull and would act as a new stable phase."
        )

    return {
        "predicted_energy_above_hull_ev_per_atom": energy_above_hull,
        "predicted_stability": "Stable" if is_stable else "Unstable",
        "is_stable": is_stable,
        "predicted_decomposition": decomposition_summary or None,
        "stability_rule": "Materials Project phase diagram: stable if predicted energy above hull is approximately 0 eV/atom",
        "materials_project_thermo_types": ", ".join(THERMO_TYPES),
        "stability_note": stability_note,
    }


def classify_stability(structure: Structure, predicted_formation_energy_per_atom: float) -> dict:
    try:
        return get_predicted_hull_data(structure, predicted_formation_energy_per_atom)
    except Exception as exc:
        # Graceful fallback when the API key is missing, the request fails,
        # or the candidate cannot be placed on the hull reliably.
        is_likely_stable = predicted_formation_energy_per_atom < 0
        fallback_status = "Likely Stable" if is_likely_stable else "Likely Unstable"
        fallback_reason = str(exc)

    return {
        "predicted_energy_above_hull_ev_per_atom": None,
        "predicted_stability": fallback_status,
        "is_stable": is_likely_stable,
        "predicted_decomposition": None,
        "stability_rule": "Fallback heuristic: predicted formation energy per atom < 0 eV/atom",
        "materials_project_thermo_types": ", ".join(THERMO_TYPES),
        "stability_note": f"Hull calculation unavailable: {fallback_reason}",
    }


def build_output_row(cif_path: Path, material_id: str, predicted_formation_energy_per_atom: float) -> dict:
    structure = Structure.from_file(cif_path)
    return {
        **extract_material_metadata(structure, material_id),
        "predicted_formation_energy_per_atom": predicted_formation_energy_per_atom,
        **classify_stability(structure, predicted_formation_energy_per_atom),
    }


def predict(run_dir: str) -> pd.DataFrame:
    run_dir = Path(run_dir)
    print("Using device:", device)

    dataset = GNoMEDataset(
        csv_path=run_dir / "inference.csv",
        cif_dir=str(run_dir),
        n_samples=None,
        cutoff=6.0,
        max_neighbors=12,
        radius_gaussians=50,
        seed=42,
    )

    loader = DataLoader(dataset, batch_size=1, shuffle=False)

    rows = []

    with torch.no_grad():
        for batch in loader:
            batch = batch.to(device)
            out = model(batch)
            
            # Convert to scalar
            val = out.detach().cpu().view(-1).tolist()
            
            # De-normalize the prediction if needed
            # formula: (normalized_val * std) + mean
            denormalized_val = [v * target_std + target_mean for v in val]

            for material_id, prediction in zip(batch.material_id, denormalized_val):
                cif_path = run_dir / f"{material_id}.cif"
                rows.append(build_output_row(cif_path, material_id, prediction))

    df = pd.DataFrame(rows)
    
    return df

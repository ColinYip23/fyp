import torch
import pandas as pd
from torch_geometric.loader import DataLoader
from pathlib import Path
from .dataset import GNoMEDataset
from .model import CGCNNRegressor

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = CGCNNRegressor(
    num_embeddings = 100,
    atom_emb_dim = 64,
    edge_dim = 50,
    hidden_dim = 128,
    num_conv_layers = 4,
    dropout = 0.1,).to(device)

model_path = Path(__file__).resolve().parent / "best_cgcnn_mp_fe.pt"
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()


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

    predictions = []
    material_ids = []

    with torch.no_grad():
        for batch in loader:
            batch = batch.to(device)
            out = model(batch)

            predictions.extend(out.detach().cpu().view(-1).tolist())
            material_ids.extend(batch.material_id)

    df = pd.DataFrame({
        "material_id": material_ids,
        "predicted_formation_energy_per_atom": predictions,
    })

    # output_path = "data/inference_predictions.csv"
    # df.to_csv(output_path, index=False)

    # print("\nPredictions:")
    # print(df)
    # print(f"\nSaved predictions to {output_path}")
    
    return df
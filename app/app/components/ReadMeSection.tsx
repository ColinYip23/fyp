'use client';

export function ReadMeSection() {
  return (
    <section className="w-full rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-8 shadow-xl space-y-6">

      {/* Purpose */}
      <div>
        <h3 className="text-xl font-bold mb-2">Purpose of the App</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          This application allows users to upload crystal structure files (.cif)
          and predict material properties using a trained Graph Neural Network (GNN).
          The main prediction target is <strong>energy above hull</strong>, which
          indicates the thermodynamic stability of a material.
        </p>
      </div>

      {/* Pipeline */}
      <div>
        <h3 className="text-xl font-bold mb-2">How the Pipeline Works</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
          The system processes your uploaded files through several stages:
        </p>

        {/* Diagram */}
        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg text-xs font-mono overflow-x-auto">
          Upload CIF Files
          → Backend API receives files
          → Model processes crystal graph
          → Predict Energy Above Hull
          → Aggregate Results
          → Display Table + CSV Output
        </div>
      </div>

      {/* Usage */}
      <div>
        <h3 className="text-xl font-bold mb-2">How to Use</h3>

        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg text-xs font-mono mb-4">
          1. Upload .cif file(s)
          → 2. Click "Run Analysis"
          → 3. Wait for processing
          → 4. Click "Show Results"
          → 5. Download predictions (CSV)
        </div>

        <ul className="list-disc ml-5 text-sm text-zinc-600 dark:text-zinc-300 space-y-1">
          <li>Supports single or multiple CIF files</li>
          <li>Only valid .cif files are accepted</li>
          <li>Results include predicted stability metrics</li>
        </ul>
      </div>

    </section>
  );
}
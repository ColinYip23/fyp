'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PredictionResult {
  [key: string]: string | number;
}

interface ResultsDisplayProps {
  runId: string;
}

// Define the columns to display in order
const DISPLAY_COLUMNS = [
    'material_id',
  'formula',
  'chemical_system',
  'predicted_formation_energy_per_atom',
  'predicted_energy_above_hull_ev_per_atom',
  'is_stable',
];

export function ResultsDisplay({ runId }: ResultsDisplayProps) {
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  console.log("Current API URL:", API_URL);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          // `http://127.0.0.1:5000/download/${runId}`, // for local testing
          `${API_URL}/download/${runId}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const text = await response.text();
        const lines = text.trim().split('\n');
        
        if (lines.length === 0) {
          throw new Error('No data in results');
        }

        // Parse CSV header
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Filter to only show the desired columns that exist in the CSV
        const availableColumns = DISPLAY_COLUMNS.filter(col => 
          headers.some(h => h.toLowerCase() === col.toLowerCase())
        );
        
        if (availableColumns.length === 0) {
          throw new Error('No expected columns found in results');
        }
        
        setColumns(availableColumns);

        // Parse CSV rows
        const data: PredictionResult[] = lines.slice(1).map((line) => {
          const values = line.split(',').map(v => v.trim());
          const row: PredictionResult = {};
          headers.forEach((header, index) => {
            const value = values[index];
            // Only include columns we want to display
            if (availableColumns.includes(header)) {
              // Try to convert to number if possible
              row[header] = isNaN(Number(value)) ? value : Number(value);
            }
          });
          return row;
        });

        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    if (runId) {
      fetchResults();
    }
  }, [runId]);

  const downloadHandle = () => {
    if (!runId) return;
    // window.location.href = `http://127.0.0.1:5000/download/${runId}`; // for local testing
    window.location.href = `${API_URL}/download/${runId}`;
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-center text-zinc-600 dark:text-zinc-400">Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
        <p className="text-center text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-center text-zinc-600 dark:text-zinc-400">No results available</p>
      </div>
    );
  }

  // Calculate heights for the table
  // Minimum height to show at least 2 rows comfortably: header (50px) + 2 rows (56px each) = 162px
  const minHeight = 200;
  // Maximum height for 5 rows: header (50px) + 5 rows (56px each) + padding = 350px
  const maxHeight = 350;

  return (
    <div className="space-y-4">
      {/* Table Container with scrolling */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div
          style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
          className="overflow-x-auto"
        >
          <div className="flex items-center justify-between">
            <h3 className="pl-5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Prediction Results
            </h3>

            <button
              onClick={() => setShowInfo(true)}
              className="rounded-full p-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Explain result columns"
            >
              <Image
                src="/infocon1.png"
                alt="Information"
                width={24}
                height={24}
              />
            </button>
          </div>

          <table className="w-full">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                  >
                    {column.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {results.map((result, index) => (
                <tr
                  key={index}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  {columns.map((column) => (
                    <td
                      key={`${index}-${column}`}
                      className="px-6 py-3 text-sm text-zinc-900 dark:text-zinc-100"
                    >
                      {typeof result[column] === 'number'
                        ? result[column].toFixed(4)
                        : result[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {showInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                    What do these results mean?
                  </h3>

                  <button
                    onClick={() => setShowInfo(false)}
                    className="rounded-full px-3 py-1 text-sm font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <p>
                    <strong>Material ID:</strong> The unique name or identifier for the uploaded material.
                  </p>

                  <p>
                    <strong>Formula:</strong> The chemical formula of the material, such as the elements it contains.
                  </p>

                  <p>
                    <strong>Chemical System:</strong> The group of elements that make up the material.
                  </p>

                  <p>
                    <strong>Predicted Formation Energy:</strong> An estimate of how much energy is involved in forming the material.
                  </p>

                  <p>
                    <strong>Predicted Energy Above Hull:</strong> A stability score. Lower values usually mean the material is more stable.
                  </p>

                  <p>
                    <strong>Is Stable:</strong> A simple yes/no result showing whether the model thinks the material is likely stable.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
    
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <button
          onClick={downloadHandle}
          className="flex items-center gap-3 rounded-full bg-blue-600 px-14 py-5 text-lg font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          Download Predictions
        </button>
      </div>
    </div>
  );
}

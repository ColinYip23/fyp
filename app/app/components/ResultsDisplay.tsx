'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://127.0.0.1:5000/download/${runId}`,
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
    window.location.href = `http://127.0.0.1:5000/download/${runId}`;
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

  // Determine max height for scrolling (approximately 5 rows + header)
  // Each row is roughly 48px + header 40px = 40 + (5 * 48) = 280px
  const maxHeight = Math.min(280 + 20, results.length * 48 + 40 + 20);

  return (
    <div className="space-y-4">
      {/* Table Container with scrolling */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div
          style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
          className="overflow-x-auto"
        >
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

import { usePrediction } from "../hooks/usePrediction";

interface DownloadButtonProps {
  disabled: boolean;
  runId: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function DownloadButton({ disabled, runId }: DownloadButtonProps) {
  const downloadHandle = () => {
    if (!runId) return;
    // window.location.href = `http://127.0.0.1:5000/download/${runId}`; // for local testing
    window.location.href = `${API_URL}/download/${runId}`;
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={downloadHandle}
        disabled={disabled}
        className={`flex items-center gap-3 rounded-full px-14 py-5 text-lg font-black transition-all
          ${
            disabled
              ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800'
              : 'bg-blue-600 text-white shadow-2xl hover:scale-105 active:scale-95'
          }`}
      >
        Download Predictions
      </button>
    </div>
  );
}

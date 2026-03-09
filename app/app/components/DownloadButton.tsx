interface DownloadButtonProps {
  disabled: boolean;
}

export function DownloadButton({ disabled }: DownloadButtonProps) {
  return (
    <div className="flex justify-center">
      <button
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

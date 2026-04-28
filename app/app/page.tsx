'use client';

import { useRef, useState } from 'react';
import { AuroraBackground } from './components/AuroraBackground';
import { AppHeader } from './components/AppHeader';
import { IntroSection } from './components/IntroSection';
import { UploadCard } from './components/UploadCard';
import { ResultsDisplay } from './components/ResultsDisplay';
import { usePrediction } from './hooks/usePrediction';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { files, status, progress, runId, error, setFiles, startPrediction } = usePrediction([
    fileInputRef,
    folderInputRef,
  ]);

  const [fileError, setFileError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Validate the selected files before starting the prediction.
  function validateCifFiles(selectedFiles: File[]): string | null {
    if (selectedFiles.length === 0) {
      const error = "Please select a file to upload.";
      setFileError(error);
      return error;
    }

    for (const selectedFile of selectedFiles) {
      const fileName = selectedFile.name.toLowerCase();

      if (!fileName.endsWith('.cif')) {
        console.error("Invalid file type selected:", selectedFile.type);
        return `Only .cif files are allowed. Invalid file: "${selectedFile.name}".`;
      }

      if (selectedFile.size === 0) {
        console.error("Selected file is empty.");
        return `The file "${selectedFile.name}" is empty.`;
      }
    }

    // Need to add validation for large file.

    console.log("Selected files are valid:", selectedFiles.map((file) => file.name));
    return null;
  }

  // Handle file selection and validate the files before setting them for prediction.
  function handleFileSelected(selectedFiles: File[]) {
    const error = validateCifFiles(selectedFiles);
    if (error) {
      setFileError(null);
      setFileError(error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
      return;
    }
    setFiles(selectedFiles);
    setFileError(null);
    setShowResults(false);
  }

  // Handle the "Run Analysis" button click, validate the files, and start the prediction if valid.
  function handleRunAnalysis() {
    const error = validateCifFiles(files);

    if (error) {
      setFileError(error);
      return;
    }
    setFileError(null);
    startPrediction();
  }

  return (
    <div className="relative min-h-screen font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <title>MateriAIlize</title>
      <AuroraBackground />
      <AppHeader />

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-20">
        <IntroSection />

        <div className="w-full space-y-8">
          <UploadCard
            files={files}
            status={status}
            progress={progress}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
            onFileSelected={handleFileSelected}
            onRunAnalysis={handleRunAnalysis}
          />

          {(fileError || error) && <p className="text-center text-red-500">{fileError ?? error}</p>}

          {/* Show Results Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowResults(!showResults)}
              disabled={status !== 'ready'}
              className={`flex items-center gap-3 rounded-full px-14 py-5 text-lg font-black transition-all
                ${
                  status !== 'ready'
                    ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800'
                    : 'bg-blue-600 text-white shadow-2xl hover:scale-105 active:scale-95'
                }`}
            >
              {showResults ? 'Hide Results' : 'Show Results'}
            </button>
          </div>

          {/* Results Display */}
          {showResults && runId && <ResultsDisplay runId={runId} />}
        </div>
      </main>

      <footer className="mt-12 py-10 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
        Material Analysis Engine
      </footer>
    </div>
  );
}

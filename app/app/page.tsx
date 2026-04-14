'use client';

import { useRef, useState } from 'react';
import { AuroraBackground } from './components/AuroraBackground';
import { AppHeader } from './components/AppHeader';
import { IntroSection } from './components/IntroSection';
import { UploadCard } from './components/UploadCard';
import { DownloadButton } from './components/DownloadButton';
import { usePrediction } from './hooks/usePrediction';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { file, status, progress, runId, error, setFile, startPrediction } = usePrediction();

  const [fileError, setFileError] = useState<string | null>(null);

  // Validate the selected file before starting the prediction.
  function validateCifFile(selectedFile: File | null): string | null {
    if (!selectedFile) {
      const error = "Please select a file to upload.";
      setFileError(error);
      return error;
    }

    const fileName = selectedFile.name.toLowerCase();

    if (!fileName.endsWith('.cif')) {
      console.error("Invalid file type selected:", selectedFile.type);
      return "Only .cif files are allowed.";
    }
    
    if (selectedFile.size === 0){
      console.error("Selected file is empty.");
      return "The selected file is empty.";
    }

    // Need to add validation for large file.

    console.log("Selected file is valid:", selectedFile.name, selectedFile.size);
    return null;
  }

  // Handle file selection and validate the file before setting it for prediction.
  function handleFileSelected(selectedFile: File | null) {
    const error = validateCifFile(selectedFile);
    if (error) {
      setFileError(null);
      setFileError(error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setFile(selectedFile);
    setFileError(null);
  }

  // Handle the "Run Analysis" button click, validate the file, and start the prediction if valid.
  function handleRunAnalysis() {
    const error = validateCifFile(file);

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
            file={file}
            status={status}
            progress={progress}
            fileInputRef={fileInputRef}
            onFileSelected={handleFileSelected}
            onRunAnalysis={handleRunAnalysis}
            fileError={fileError}
          />

          {fileError && <p className="text-red-500 text-center">{fileError}</p>}

          <DownloadButton disabled={status !== 'ready'} runId={runId} />
        </div>
      </main>

      <footer className="mt-12 py-10 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
        Material Analysis Engine
      </footer>
    </div>
  );
}

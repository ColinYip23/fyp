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
  const { file, status, progress, setFile, startPrediction } = usePrediction();

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
      return "Only .cif files are allowed.";
    }
    
    if (selectedFile.size === 0){
      return "The selected file is empty.";
    }

    // Need to add validation for large file.

    return null;
  }

  // Handle file selection and validate the file before setting it for prediction.
  function handleFileSelected(selectedFile: File | null) {
    const error = validateCifFile(selectedFile);
    if (error) {
      setFileError(error);
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
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
            onFileSelected={setFile}
            onRunAnalysis={startPrediction}     
          />
          <DownloadButton disabled={status !== 'ready'} />
        </div>
      </main>

      <footer className="mt-12 py-10 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
        Material Analysis Engine
      </footer>
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { AuroraBackground } from './components/AuroraBackground';
import { AppHeader } from './components/AppHeader';
import { IntroSection } from './components/IntroSection';
import { UploadCard } from './components/UploadCard';
import { DownloadButton } from './components/DownloadButton';
import { usePrediction } from './hooks/usePrediction';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { file, status, progress, setFile, startPrediction } = usePrediction();

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

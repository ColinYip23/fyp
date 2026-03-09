'use client';

import { useEffect, useRef, useState } from 'react';

export type PredictionStatus = 'idle' | 'processing' | 'ready';

export function usePrediction() {
  const [file, setFileState] = useState<File | null>(null);
  const [status, setStatus] = useState<PredictionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const clearProgressInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const setFile = (nextFile: File | null) => {
    clearProgressInterval();
    setFileState(nextFile);
    setProgress(0);
    setStatus('idle');
  };

  const startPrediction = () => {
    if (!file) return;

    clearProgressInterval();
    setStatus('processing');
    setProgress(0);

    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        setProgress(100);
        setStatus('ready');
        clearProgressInterval();
        return;
      }

      setProgress(Math.floor(currentProgress));
    }, 600);
  };

  return {
    file,
    status,
    progress,
    setFile,
    startPrediction,
  };
}

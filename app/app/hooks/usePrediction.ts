'use client';

import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

export type PredictionStatus = 'idle' | 'processing' | 'ready' | 'error';

type StatusResponse = {
  phase: string;
  message: string;
  progress?: {
    done: number;
    total: number;
  };
};

export function usePrediction(fileInputRefs: Array<RefObject<HTMLInputElement | null>>) {
  const [files, setFilesState] = useState<File[]>([]);
  const [status, setStatus] = useState<PredictionStatus>('idle');
  const [progress, setProgress] = useState(0);
  
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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

  const setFiles = (nextFiles: File[]) => {
    console.log("setFiles is called with", nextFiles.map((file) => file.name));
    clearProgressInterval();
    setFilesState(nextFiles);
    setProgress(0);
    setStatus('idle');
    setRunId(null);
    setError(null);
  };

  const pollStatus = (currentRunId: string) => {
    clearProgressInterval();
    console.log("Polling runId: ", currentRunId);

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/status/${currentRunId}`);
        const data: StatusResponse | {error: string} = await res.json();
        console.log("Poll status: ", data);
        if (!res.ok) {
          const message = 'error' in data ? data.error : 'Failed to fetch status.';
          throw new Error(message);
        }

        const statusData = data as StatusResponse;

        const done = statusData.progress?.done ?? 0;
        const total = statusData.progress?.total ?? 1;
        const percent = Math.round((done/total) * 100);

        setProgress(percent);

        if (statusData.phase === "ready") {
          setProgress(100);
          setStatus("ready");
          clearProgressInterval();
          return;
        }

        if (statusData.phase === "error") {
          setStatus("error");
          setError(statusData.message || "Prediction Failed");
          clearProgressInterval();
          return;          
        }

        setStatus("processing")
      } catch (err) {
        setStatus("error");
        setError("Polling Failed");
        clearProgressInterval();
      }
    }, 2000)
        };

  const startPrediction = async () => {
    const selectedFilesFromInputs = fileInputRefs.flatMap((inputRef) =>
      inputRef.current?.files ? Array.from(inputRef.current.files) : []
    );
    const selectedFiles = selectedFilesFromInputs.length > 0
      ? selectedFilesFromInputs
      : files;

    if (selectedFiles.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    try{
    console.log("Starting prediction for ", selectedFiles.map((file) => file.name));
    clearProgressInterval();
    setStatus('processing');
    setProgress(0);
    setError(null);
    setRunId(null);

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("files", file, file.name);
    }

    const uploadRes = await fetch('http://127.0.0.1:5000/upload',{method: 'POST', body: formData});
    const uploadData = await uploadRes.json();

    console.log("Upload data: ", uploadData);
    console.log("runid from backend: ", uploadData.runId);

    if (!uploadRes.ok) {
      throw new Error(uploadData.error || "Upload failed.");
    }

    const newRunId = uploadData.runId as string;
    setRunId(newRunId);

    pollStatus(newRunId);
    } catch (err) {
    setStatus("error");
    setError(err instanceof Error ? err.message : "Something went wrong.");
  }
    // let currentProgress = 0;
    // intervalRef.current = setInterval(() => {
    //   currentProgress += Math.random() * 15;
    //   if (currentProgress >= 100) {
    //     setProgress(100);
    //     setStatus('ready');
    //     clearProgressInterval();
    //     return;
    //   }

    //   setProgress(Math.floor(currentProgress));
    // }, 600);
  };

  return {
    files,
    status,
    progress,
    runId,
    error,
    setFiles,
    startPrediction,
  };
}

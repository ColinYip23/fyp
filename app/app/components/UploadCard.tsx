'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';
import type { PredictionStatus } from '../hooks/usePrediction';

interface UploadCardProps {
  file: File | null;
  status: PredictionStatus;
  progress: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelected: (file: File | null) => void;
  onRunAnalysis: () => void;
}

export function UploadCard({
  file,
  status,
  progress,
  fileInputRef,
  onFileSelected,
  onRunAnalysis,
}: UploadCardProps) {
  return (
    <motion.div className="overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center p-20 transition-all
          ${file ? 'bg-blue-600/5' : 'hover:bg-zinc-500/5'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />

        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200 dark:shadow-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold">{file ? file.name : 'Upload Dataset'}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Drag your dataset here or browse files</p>

        {file && status === 'idle' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(event) => {
              event.stopPropagation();
              onRunAnalysis();
            }}
            className="mt-8 rounded-full bg-zinc-900 px-10 py-3 font-bold text-white dark:bg-white dark:text-black"
          >
            Run Analysis
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {(status === 'processing' || status === 'ready') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="border-t border-zinc-100 bg-zinc-50/50 p-10 dark:border-white/5 dark:bg-black/20"
          >
            <div className="mb-4 flex items-center justify-between font-mono text-sm">
              <span className="font-bold uppercase tracking-tighter text-blue-600">
                {status === 'processing' ? 'Processing...' : 'Done'}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

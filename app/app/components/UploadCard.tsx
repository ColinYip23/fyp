'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { InputHTMLAttributes, RefObject } from 'react';
import type { PredictionStatus } from '../hooks/usePrediction';

type FolderInputAttributes = InputHTMLAttributes<HTMLInputElement> & {
  directory?: string;
  webkitdirectory?: string;
};

interface UploadCardProps {
  files: File[];
  status: PredictionStatus;
  progress: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onFileSelected: (files: File[]) => void;
  onRunAnalysis: () => void;
}

export function UploadCard({
  files,
  status,
  progress,
  fileInputRef,
  folderInputRef,
  onFileSelected,
  onRunAnalysis,
}: UploadCardProps) {
  const hasFiles = files.length > 0;
  const fileLabel =
    files.length === 1 ? files[0].name : `${files.length} CIF files selected`;
  const folderInputProps: FolderInputAttributes = {
    directory: '',
    webkitdirectory: '',
  };

  return (
    <motion.div className="overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center p-20 transition-all
          ${hasFiles ? 'bg-blue-600/5' : 'hover:bg-zinc-500/5'}`}
      >
        <input
          type="file"
          multiple
          accept=".cif"
          ref={fileInputRef}
          className="hidden"
          onChange={(event) => onFileSelected(Array.from(event.target.files ?? []))}
        />
        <input
          type="file"
          multiple
          ref={folderInputRef}
          className="hidden"
          onChange={(event) => onFileSelected(Array.from(event.target.files ?? []))}
          {...folderInputProps}
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

        <h3 className="text-xl font-bold">{hasFiles ? fileLabel : 'Upload CIF Files'}</h3>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {hasFiles
            ? files.slice(0, 3).map((selectedFile) => selectedFile.name).join(', ')
            : 'Choose CIF files directly or pick a folder containing CIF files to analyze.'}
        </p>
        {files.length > 3 && (
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            +{files.length - 3} more files
          </p>
        )}

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-bold text-zinc-900 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 dark:border-white/15 dark:bg-white/5 dark:text-white"
          >
            Select Files
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-bold text-zinc-900 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 dark:border-white/15 dark:bg-white/5 dark:text-white"
          >
            Select Folder
          </button>
        </div>

        {hasFiles && status === 'idle' && (
          <motion.button
            type="button"
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

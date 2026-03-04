'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startPrediction = () => {
    if (!file) return;
    setStatus('processing');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        setProgress(100);
        setStatus('ready');
        clearInterval(interval);
      } else {
        setProgress(Math.floor(p));
      }
    }, 600);
  };

  return (
    <div className="relative min-h-screen font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <title>MateriAIlize</title>

      {/* NEW: Smooth Aurora Background Blobs */}
      <div className="aurora-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/50 bg-white/40 backdrop-blur-xl dark:border-white/5 dark:bg-black/40 px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            MateriAIlize
          </h1>
          <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">FYP System</div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-20">
        
        {/* Intro */}
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-extrabold tracking-tight"
          >
            Material <span className="text-blue-600">AI</span> Analysis
          </motion.h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">
            Powered by Graph Neural Networks for material stability prediction.
          </p>
        </div>

        {/* Main Interface */}
        <div className="w-full space-y-8">
          <motion.div 
            className="overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5"
          >
            {/* Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex cursor-pointer flex-col items-center justify-center p-20 transition-all
                ${file ? 'bg-blue-600/5' : 'hover:bg-zinc-500/5'}`}
            >
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
              
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200 dark:shadow-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold">{file ? file.name : "Upload Dataset"}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Drag your dataset here or browse files</p>

              {file && status === 'idle' && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={(e) => { e.stopPropagation(); startPrediction(); }}
                  className="mt-8 rounded-full bg-zinc-900 px-10 py-3 font-bold text-white dark:bg-white dark:text-black"
                >
                  Run Analysis
                </motion.button>
              )}
            </div>

            {/* Progress Section */}
            <AnimatePresence>
              {(status === 'processing' || status === 'ready') && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-zinc-100 bg-zinc-50/50 p-10 dark:border-white/5 dark:bg-black/20"
                >
                  <div className="mb-4 flex items-center justify-between font-mono text-sm">
                    <span className="font-bold text-blue-600 uppercase tracking-tighter">
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

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              disabled={status !== 'ready'}
              className={`flex items-center gap-3 rounded-full px-14 py-5 text-lg font-black transition-all
                ${status === 'ready' 
                  ? 'bg-blue-600 text-white shadow-2xl hover:scale-105 active:scale-95' 
                  : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800'}`}
            >
              Download Predictions
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-12 py-10 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
        MateriAIlize Analysis Engine · 2026
      </footer>
    </div>
  );
}
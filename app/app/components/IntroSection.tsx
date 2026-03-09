'use client';

import { motion } from 'framer-motion';

export function IntroSection() {
  return (
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
  );
}

'use client';

import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import { motion } from 'framer-motion';
import { ReadMeSection } from './ReadMeSection';
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { CustomDialog } from './CustomDialog';
import Button from '@mui/material/Button';


export function IntroSection() {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
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
      <Button sx={{color:'white', marginTop:2, marginBottom:0}} variant="outlined" onClick={handleOpen} startIcon={<InfoIcon />}>
        Read me First
      </Button>

      <CustomDialog open={open} onClose={handleClose} height='auto' width='80vw'>
        <ReadMeSection />
      </CustomDialog>
    </div>
  );
}

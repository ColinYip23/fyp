'use client';

import { Dialog, DialogContent } from "@mui/material";
import { ReactNode } from "react";

type CustomDialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function CustomDialog({ open, onClose, children }: CustomDialogProps) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            background: "transparent",
            boxShadow: "none",
            margin: 0,
            color: "inherit",
          }
        }}
      >
        <DialogContent sx={{ padding: 0 }}>
          {children}
        </DialogContent>
        </Dialog>
    );
}
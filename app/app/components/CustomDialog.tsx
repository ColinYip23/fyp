'use client';

import { Dialog, DialogContent } from "@mui/material";
import { ReactNode } from "react";

type CustomDialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  height?: string;
};

// Reusable custom dialog component that can be used across the app for displaying content in a dialog with consistent styling.
export function CustomDialog({ open, onClose, children, width, height }: CustomDialogProps) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        sx={{
          "& .MuiDialog-paper": {
            width,
            height,
            background: "rgba(24, 24, 27, 0.75)",
            backdropFilter: "blur(12px)",
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
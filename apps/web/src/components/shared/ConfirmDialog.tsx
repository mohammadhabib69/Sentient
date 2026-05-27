"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-50 w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-6 shadow-2xl"
          >
            <div className="flex gap-4">
              {isDanger && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--red)]/10 text-[var(--red)]">
                  <AlertTriangle className="size-5" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-[var(--foreground-2)] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button
                onClick={onConfirm}
                className={
                  isDanger
                    ? "bg-[var(--red)] text-white hover:bg-[var(--red)]/90"
                    : "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90"
                }
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

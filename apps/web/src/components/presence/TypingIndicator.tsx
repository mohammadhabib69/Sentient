"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useTypingIndicator } from "@/hooks/useTyping";
import { cn } from "@/lib/utils";

/**
 * TypingIndicator — "Sarah is typing..." pill for a given task.
 *
 * Subscribes to the per-task typing set via `useTypingIndicator(taskId)`
 * and shows an animated three-dot pulse while the set is non-empty.
 *
 * Names: in a future iteration this would resolve userIds to display
 * names via the user store; for now we show the count to keep the
 * surface area small and avoid coupling to user fetch state.
 */
export function TypingIndicator({
  taskId,
  className,
  emptyLabel,
}: {
  taskId: string | null | undefined;
  className?: string;
  emptyLabel?: string;
}) {
  const typing = useTypingIndicator(taskId);

  return (
    <AnimatePresence initial={false}>
      {typing.length > 0 ? (
        <motion.div
          key="typing"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "flex items-center gap-1.5 text-xs text-[var(--foreground-3)]",
            className,
          )}
        >
          <Dots />
          <span>
            {typing.length === 1
              ? "1 person is typing…"
              : `${typing.length} people are typing…`}
          </span>
        </motion.div>
      ) : emptyLabel ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn("text-xs text-[var(--foreground-3)]", className)}
        >
          {emptyLabel}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1 rounded-full bg-[var(--foreground-3)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

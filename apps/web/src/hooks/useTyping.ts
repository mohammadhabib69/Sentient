"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Listen for `typing:start` / `typing:stop` events on a given task.
 *
 * Returns the set of `userId`s currently typing on that task. Components
 * typically render "Sarah is typing..." while the set is non-empty.
 */
export function useTypingIndicator(taskId: string | null | undefined): string[] {
  const [typing, setTyping] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!taskId) return;
    const socket = typeof window !== "undefined" ? window.__socket : undefined;
    if (!socket) return;

    const onStart = (data: { userId: string; taskId: string }) => {
      if (data.taskId !== taskId) return;
      setTyping((prev) => {
        if (prev.has(data.userId)) return prev;
        const next = new Set(prev);
        next.add(data.userId);
        return next;
      });
    };

    const onStop = (data: { userId: string; taskId: string }) => {
      if (data.taskId !== taskId) return;
      setTyping((prev) => {
        if (!prev.has(data.userId)) return prev;
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on("typing:start", onStart);
    socket.on("typing:stop", onStop);

    return () => {
      socket.off("typing:start", onStart);
      socket.off("typing:stop", onStop);
    };
  }, [taskId]);

  return Array.from(typing);
}

/**
 * Emit typing events for a given task.
 *
 * Call `startTyping` from the comment box's `onChange`, and let the
 * auto-stop (3s server-side) handle the rest. `stopTyping` is available
 * for cases where you want an explicit signal (e.g. the user clears the
 * input or submits).
 */
export function useTypingEmitter(taskId: string | null | undefined) {
  const startTyping = useCallback(() => {
    if (!taskId) return;
    window.__socket?.emit("typing:start", { taskId });
  }, [taskId]);

  const stopTyping = useCallback(() => {
    if (!taskId) return;
    window.__socket?.emit("typing:stop", { taskId });
  }, [taskId]);

  return { startTyping, stopTyping };
}

"use client";

import { useEffect } from "react";

/**
 * Join a Socket.io room when a component mounts; leave on unmount.
 *
 * Used by workspace / project / task pages so that scoped events
 * (typing, collaboration, comments) only reach the users that are
 * currently looking at the same entity.
 */
export function useRoom(type: "workspace" | "project" | "task", id: string | null | undefined): void {
  useEffect(() => {
    if (!id) return;
    const socket = typeof window !== "undefined" ? window.__socket : undefined;
    if (!socket) return;

    socket.emit("room:join", { type, id });

    return () => {
      // Guard against the socket being torn down before this effect's
      // cleanup runs (happens on logout).
      const stillThere = typeof window !== "undefined" ? window.__socket : undefined;
      stillThere?.emit("room:leave", { type, id });
    };
  }, [type, id]);
}

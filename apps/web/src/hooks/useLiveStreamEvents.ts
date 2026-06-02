"use client";

import { useEffect, useState } from "react";

import { useSocket } from "@/providers/RealtimeProvider";
import type { StreamEvent } from "@/types/event.types";

/**
 * useLiveStreamEvents — Phase 6 §13.
 *
 * Subscribes to the `stream:event` socket event and accumulates the
 * last `max` events (newest first). Returns the live list; the caller
 * is responsible for merging it with any historical data.
 */
export function useLiveStreamEvents(max = 50): StreamEvent[] {
  const socket = useSocket();
  const [events, setEvents] = useState<StreamEvent[]>([]);

  useEffect(() => {
    if (!socket) return;

    const onEvent = (event: StreamEvent) => {
      setEvents((prev) => {
        // De-dup by id (the server may echo the same id on reconnect
        // backfill). Then prepend, then cap.
        const filtered = prev.filter((e) => e.id !== event.id);
        return [event, ...filtered].slice(0, max);
      });
    };

    socket.on("stream:event", onEvent);
    return () => {
      socket.off("stream:event", onEvent);
    };
  }, [socket, max]);

  return events;
}

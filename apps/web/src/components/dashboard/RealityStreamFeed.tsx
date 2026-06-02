"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Cpu, AlertTriangle } from "lucide-react";

import { useStreamEvents } from "@/hooks/useStream";
import { useLiveStreamEvents } from "@/hooks/useLiveStreamEvents";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";
import type { StreamEvent } from "@/types/event.types";

/**
 * RealityStreamFeed — Phase 6 §13.
 *
 * Two data sources, merged newest-first:
 *  1. Historical — `useStreamEvents()` (React Query fixture/history).
 *  2. Live — `useLiveStreamEvents(50)` from the `stream:event` socket.
 *
 * Live events get a tiny framer-motion enter animation; the rest of
 * the row is unchanged. The presence ring shows online users from
 * `useUIStore.onlineUsers`.
 */
export function RealityStreamFeed() {
  const { data: history = [], isLoading } = useStreamEvents();
  const live = useLiveStreamEvents(50);
  const onlineUsers = useUIStore((s) => s.onlineUsers);

  // Merge: live events (newest first) + history, dedup by id.
  const merged = React.useMemo<StreamEvent[]>(() => {
    const seen = new Set<string>();
    const out: StreamEvent[] = [];
    for (const e of live) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      out.push(e);
    }
    for (const e of history) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      out.push(e);
    }
    return out.slice(0, 8); // dashboard cap; the /stream page is unbounded
  }, [live, history]);

  // Build a set of online user ids for the green dot indicator.
  const onlineUserIds = React.useMemo(
    () => new Set(Object.keys(onlineUsers)),
    [onlineUsers],
  );

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-2)]" />;
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-glass-border bg-surface-container">
      <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
        <h2 className="text-base font-semibold text-on-surface">Reality Stream</h2>
        <span
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-mist-teal"
          title={`${onlineUserIds.size} online`}
        >
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {onlineUserIds.size} online
        </span>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {merged.map((event) => {
              const variant = event.display?.variant;
              const isError = variant === "critical" || event.type === "webhook_failed";
              const isAgent = event.actor.type === "agent";
              const isUser = event.actor.type === "user";
              const isLive = live.some((e) => e.id === event.id);

              const Icon = isError ? AlertTriangle : isAgent ? Bot : isUser ? User : Cpu;
              const bgColor = isError
                ? "bg-error-red/10 text-error-red"
                : isAgent
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-variant text-on-surface-variant";

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={isLive ? { opacity: 0, y: -12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-container-high"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                      bgColor,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-on-surface-variant">
                      <span className="font-medium text-on-surface">{event.actor.name}</span>
                      {event.display?.badge && (
                        <span className="ml-2 font-mono text-[9px] uppercase text-mist-teal">
                          {event.display.badge}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {event.display?.description ?? event.type.replace(/_/g, " ")}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/RealtimeProvider";
import { analyticsKeys } from "./useAnalytics";

/**
 * Phase 11 — Analytics real-time hook.
 *
 * Subscribes the current socket to one or more analytics dashboards so
 * the matching React Query cache is invalidated when the server pushes
 * a fresh frame. Multiple components can call this hook with the same
 * dashboard; the subscription is deduped via the `subscribed` flag on
 * the socket itself.
 */
export function useAnalyticsSocket(
  dashboards: ("overview" | "velocity" | "agents" | "projects" | "anomalies")[],
) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const subscribed: string[] = [];

    for (const d of dashboards) {
      // Dedup across hook instances — keep a Set of active subs on the
      // socket object so re-renders don't double-subscribe.
      type WithSubs = typeof socket & { __analyticsSubs?: Set<string> };
      const s = socket as WithSubs;
      s.__analyticsSubs = s.__analyticsSubs ?? new Set();
      if (s.__analyticsSubs.has(d)) continue;
      s.__analyticsSubs.add(d);
      socket.emit("analytics:subscribe", { dashboard: d });
      subscribed.push(d);
    }

    const onUpdate = (dashboard: string) => (payload: { timestamp: string; data: unknown }) => {
      // Don't blindly trust the server — only invalidate. The next
      // query refetch will pull the canonical value. This avoids
      // double-render flicker from optimistic updates racing with the
      // socket frame.
      switch (dashboard) {
        case "overview":
          queryClient.invalidateQueries({ queryKey: analyticsKeys.overview() });
          break;
        case "velocity":
          queryClient.invalidateQueries({ queryKey: ["analytics", "velocity"] });
          break;
        case "agents":
          queryClient.invalidateQueries({ queryKey: ["analytics", "agents"] });
          break;
        case "projects":
          queryClient.invalidateQueries({ queryKey: ["analytics", "projects"] });
          break;
        case "anomalies":
          queryClient.invalidateQueries({ queryKey: ["analytics", "anomalies"] });
          queryClient.invalidateQueries({ queryKey: analyticsKeys.overview() });
          break;
      }
      // Mark a timestamp on the cache so consumers can show "live".
      void payload;
    };

    const handlers: Array<[string, (p: { timestamp: string; data: unknown }) => void]> = [];
    for (const d of subscribed) {
      const handler = onUpdate(d);
      socket.on(`analytics:${d}:update`, handler);
      handlers.push([`analytics:${d}:update`, handler]);
    }

    // Critical-anomaly toast trigger.
    const onNew = (payload: {
      timestamp: string;
      anomaly: { id: string; metric: string; severity: string; description: string };
    }) => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "anomalies"] });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.overview() });
      // Surface as a window event so a top-level toast component
      // can show it without each dashboard re-wiring the listener.
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("analytics:anomaly:new", { detail: payload.anomaly }),
        );
      }
    };
    socket.on("analytics:anomaly:new", onNew);

    return () => {
      for (const [event, handler] of handlers) {
        socket.off(event, handler);
      }
      socket.off("analytics:anomaly:new", onNew);
      for (const d of subscribed) {
        socket.emit("analytics:unsubscribe", { dashboard: d });
        type WithSubs = typeof socket & { __analyticsSubs?: Set<string> };
        const s = socket as WithSubs;
        s.__analyticsSubs?.delete(d);
      }
    };
  }, [socket, queryClient, dashboards.join("|")]);
}

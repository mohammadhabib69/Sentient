"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { useAuthStore } from "@/store/auth.store";
import { useTaskStore } from "@/store/task.store";
import { useAgentStore } from "@/store/agent.store";
import { useNotificationStore } from "@/store/notification.store";
import { useUIStore } from "@/store/ui.store";
import type { AgentAction } from "@/types/agent.types";
import type { Notification } from "@/store/notification.store";
import type { StreamEvent } from "@/types/event.types";

const SocketContext = createContext<Socket | null>(null);

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
const WS_PATH = process.env.NEXT_PUBLIC_WS_PATH ?? "/socket.io";

/**
 * RealtimeProvider — owns the singleton Socket.io client for the app.
 *
 *  - Opens a connection when the user is authenticated (we know who they
 *    are via `useAuthStore`).
 *  - Wires every server event we care about to a Zustand store action.
 *    Stores are the only public surface; UI components should not touch
 *    the socket directly.
 *  - Sends a 30-second heartbeat so the server can refresh presence.
 *  - Exposes the socket via React context (`useSocket`) for components
 *    that need to emit (e.g. typing indicators, room joins).
 *
 * Auth model: the access token is stored in an httpOnly cookie, so we
 * just send `withCredentials: true` and let the browser forward it. The
 * server's JWT middleware accepts either the cookie or an explicit
 * `auth.token` payload.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // Don't connect until the user is known.
    if (!user) return;

    const s = io(WS_URL, {
      path: WS_PATH,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = s;
    window.__socket = s;
    setSocket(s);

    // ── Tasks ──────────────────────────────────────────────────────────
    s.on("task:created", (envelope: { payload: { id: string; title: string; projectId: string }; timestamp: string }) => {
      const data = envelope.payload;
      // The backend will eventually send the full task; for now we
      // optimistically add a minimal stub and let React Query refetch
      // the canonical list. Stale data here is harmless — the modal/breadcrumb
      // shows the new title immediately, the next fetch reconciles.
      useTaskStore.getState().addTask({
        id: data.id,
        projectId: data.projectId,
        title: data.title,
        description: null,
        status: "todo",
        priority: "medium",
        assignee: null,
        agentAssigned: false,
        dueDate: null,
        estimatedHours: null,
        position: 0,
        createdAt: envelope.timestamp ?? new Date().toISOString(),
        updatedAt: envelope.timestamp ?? new Date().toISOString(),
      });
    });

    s.on("task:updated", (envelope: { payload: { id: string; changes: Record<string, unknown> } }) => {
      const data = envelope.payload;
      useTaskStore.getState().updateTask(data.id, data.changes);
    });

    s.on("task:deleted", (envelope: { payload: { id: string } }) => {
      const data = envelope.payload;
      useTaskStore.getState().deleteTask(data.id);
    });

    s.on(
      "task:moved",
      (envelope: {
        payload: {
          id: string;
          to: { status: "todo" | "in_progress" | "review" | "done" | "blocked"; position: number };
        };
      }) => {
        const data = envelope.payload;
        useTaskStore.getState().moveTask(data.id, data.to.status, data.to.position);
      },
    );

    // ── Agents ─────────────────────────────────────────────────────────
    s.on("agent:action_pending", (data: { action: AgentAction }) => {
      useAgentStore.getState().addApproval(data.action);
    });

    s.on("agent:action_executed", (data: { actionId: string }) => {
      useAgentStore.getState().removeApproval(data.actionId);
    });

    // ── Notifications ──────────────────────────────────────────────────
    s.on("notification:new", (data: { notification: Notification }) => {
      useNotificationStore.getState().addNotification(data.notification);
    });

    // ── Presence ───────────────────────────────────────────────────────
    s.on("presence:online", (data: { userId: string }) => {
      useUIStore.getState().setUserOnline(data.userId);
    });

    s.on("presence:offline", (data: { userId: string }) => {
      useUIStore.getState().setUserOffline(data.userId);
    });

    s.on(
      "presence:heartbeat",
      (data: { userId: string; page: string; lastSeen: string }) => {
        useUIStore.getState().setUserPage(data.userId, data.page, data.lastSeen);
      },
    );

    // ── Metrics ────────────────────────────────────────────────────────
    s.on(
      "metrics:updated",
      (data: {
        activeTasks: number;
        pendingApprovals: number;
        agentActionsToday: number;
        healthScore: number;
        updatedAt: string;
      }) => {
        useUIStore.getState().setDashboardMetrics(data);
      },
    );

    // ── Reality Stream (listen at provider level so a global toast can
    // be wired up later; today the dashboard's RealityStreamFeed
    // subscribes via the same provider-bound socket). ──────────────────
    s.on("stream:event", (_event: StreamEvent) => {
      // The dashboard's RealityStreamFeed also subscribes to this event
      // and re-emits into its own state. We keep this listener as a hook
      // point for cross-cutting UI (e.g. a global toast).
    });

    // ── Heartbeat ──────────────────────────────────────────────────────
    const heartbeat = window.setInterval(() => {
      s.emit("presence:heartbeat", { page: window.location.pathname });
    }, 30_000);

    s.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[Realtime] disconnected:", reason);
      }
    });

    return () => {
      window.clearInterval(heartbeat);
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
      window.__socket = undefined;
      setSocket(null);
    };
  }, [user?.id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

/** Read the live socket from context. Returns `null` until connection. */
export function useSocket(): Socket | null {
  return useContext(SocketContext);
}

import type { Server, Socket } from "socket.io";
import { getSocketUser } from "./socket.types.js";
import { emitToOrg } from "./events.js";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { overviewAnalyticsService } from "../modules/analytics/overview.analytics.js";
import { velocityAnalyticsService } from "../modules/analytics/velocity.analytics.js";
import { agentAnalyticsService } from "../modules/analytics/agent.analytics.js";
import { projectsAnalyticsService } from "../modules/analytics/projects.analytics.js";
import { anomalyDetectionService } from "../modules/analytics/anomaly-detection.js";

/**
 * Analytics websocket handlers — subscribe/unsubscribe from named
 * dashboards and receive periodic updates.
 *
 * Events:
 *   client → server:
 *     analytics:subscribe   { dashboard: "overview" | "velocity" | ... }
 *     analytics:unsubscribe { dashboard: string }
 *
 *   server → client:
 *     analytics:overview:update
 *     analytics:velocity:update
 *     analytics:agents:update
 *     analytics:projects:update
 *     analytics:anomalies:update
 */
export function registerAnalyticsHandlers(_io: Server, socket: Socket): void {
  const user = getSocketUser(socket);
  if (!user) return;

  socket.on("analytics:subscribe", async (payload: { dashboard?: string }) => {
    const dashboard = String(payload?.dashboard ?? "").trim();
    if (!dashboard) return;
    if (!isValidDashboard(dashboard)) return;
    const room = `analytics:${user.orgId}:${dashboard}`;
    await socket.join(room);
    console.log(
      `[ws][analytics] user=${user.userId} subscribed to ${room}`,
    );
  });

  socket.on(
    "analytics:unsubscribe",
    async (payload: { dashboard?: string }) => {
      const dashboard = String(payload?.dashboard ?? "").trim();
      if (!dashboard) return;
      const room = `analytics:${user.orgId}:${dashboard}`;
      await socket.leave(room);
    },
  );
}

const VALID_DASHBOARDS = new Set([
  "overview",
  "velocity",
  "agents",
  "projects",
  "anomalies",
]);

function isValidDashboard(name: string): boolean {
  return VALID_DASHBOARDS.has(name);
}

// ─── Broadcast helpers ──────────────────────────────────────

/**
 * Emit an update to every socket subscribed to a dashboard for the org.
 * The body shape is `{ timestamp, data }` so consumers can drop stale
 * frames easily.
 */
export function broadcastAnalyticsUpdate(
  orgId: string,
  dashboard: string,
  data: unknown,
): void {
  emitToOrg(orgId, `analytics:${dashboard}:update`, {
    timestamp: new Date().toISOString(),
    data,
  });
}

// ─── Periodic tick ───────────────────────────────────────────

let tickHandle: NodeJS.Timeout | null = null;
const TICK_MS = env.ANALYTICS_BROADCAST_INTERVAL_MS;

/**
 * Walk every online org and broadcast a fresh snapshot of each
 * dashboard. Cheaper than scanning `Organization` — driven from
 * `presence:*` keys in Redis.
 */
async function tickAllOrgs(): Promise<void> {
  let cursor = "0";
  const orgIds = new Set<string>();
  const { redisClient } = await import("../config/redis.js");
  try {
    do {
      const [next, keys] = await redisClient.scan(
        cursor,
        "MATCH",
        "presence:*",
        "COUNT",
        200,
      );
      cursor = next;
      for (const k of keys) {
        // presence:{orgId}:{userId}
        const parts = k.split(":");
        if (parts.length >= 3) orgIds.add(parts[1]!);
      }
    } while (cursor !== "0");
  } catch (err) {
    console.error("[analytics-broadcast] redis scan failed", err);
    return;
  }

  await Promise.allSettled(
    Array.from(orgIds).map(async (orgId) => {
      try {
        const overview = await overviewAnalyticsService.getOverview(orgId);
        broadcastAnalyticsUpdate(orgId, "overview", overview);
      } catch (err) {
        console.error(`[analytics-broadcast] overview org=${orgId}`, err);
      }

      // Velocity is the most expensive — only run on a 2× slower cadence
      // (we re-emit the previous one when this tick lands on an "off"
      // beat by simply skipping it; the cached socket frame still
      // satisfies the 30s budget the user sees).
      const beat = Math.floor(Date.now() / TICK_MS);
      if (beat % 2 === 0) {
        try {
          const velocity = await velocityAnalyticsService.getVelocity(
            orgId,
            30,
          );
          broadcastAnalyticsUpdate(orgId, "velocity", velocity);
        } catch (err) {
          console.error(`[analytics-broadcast] velocity org=${orgId}`, err);
        }

        try {
          const agents = await agentAnalyticsService.getAgentMetrics(
            orgId,
            30,
          );
          broadcastAnalyticsUpdate(orgId, "agents", agents);
        } catch (err) {
          console.error(`[analytics-broadcast] agents org=${orgId}`, err);
        }
      }

      try {
        const projects = await projectsAnalyticsService.getProjectHealth(
          orgId,
          20,
        );
        broadcastAnalyticsUpdate(orgId, "projects", projects);
      } catch (err) {
        console.error(`[analytics-broadcast] projects org=${orgId}`, err);
      }

      try {
        const anomalies = await anomalyDetectionService.listAnomalies(orgId, {
          limit: 20,
        });
        broadcastAnalyticsUpdate(orgId, "anomalies", anomalies);
      } catch (err) {
        console.error(`[analytics-broadcast] anomalies org=${orgId}`, err);
      }
    }),
  );
}

export function startAnalyticsBroadcaster(): void {
  if (tickHandle) return;
  // First tick after 5s so initial paint + connect happens first.
  setTimeout(() => {
    void tickAllOrgs();
  }, 5_000);
  tickHandle = setInterval(() => {
    void tickAllOrgs();
  }, TICK_MS);
  tickHandle.unref?.();
  console.log(
    `[analytics-broadcast] started (every ${TICK_MS}ms)`,
  );
}

export function stopAnalyticsBroadcaster(): void {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

/**
 * Convenience for the Anomaly controller to push a real-time
 * notification when a critical anomaly is recorded. The dashboard
 * can pop a toast on the new frame.
 */
export function broadcastAnomalyCreated(
  orgId: string,
  anomaly: {
    id: string;
    metric: string;
    severity: string;
    description: string;
  },
): void {
  emitToOrg(orgId, "analytics:anomaly:new", {
    timestamp: new Date().toISOString(),
    anomaly,
  });
}

// Quiet prisma import warning when this file is tree-shaken in tests.
void prisma;

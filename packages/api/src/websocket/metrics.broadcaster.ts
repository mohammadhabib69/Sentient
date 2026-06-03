import { AgentActionStatus, TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { redisClient } from "../config/redis.js";
import { emitToOrg } from "./events.js";
import { getQueueMetrics } from "../modules/queue/queue-metrics.js";

/**
 * PRD §11 — Live Dashboard Metrics.
 *
 * The dashboard's metric cards update without refresh: a small broadcaster
 * computes the four numbers, caches the result in Redis, and pushes
 * `metrics:updated` to every socket in the org room.
 *
 * Two invocation paths:
 *   1. **Reactive** — task CRUD / agent-action transitions call
 *      `broadcastOrgMetrics(orgId)` directly. This is the common case.
 *   2. **Tick** — `startMetricsBroadcaster()` schedules a periodic tick so
 *      organizations with very low write volume still see the numbers
 *      tick forward (e.g. midnight roll-over for `agentActionsToday`).
 *
 * The Redis cache is read-then-write with a 5-second TTL so a burst of
 * triggers doesn't stampede Postgres — every request within the TTL
 * returns the cached value and re-broadcasts it.
 */

const METRICS_CACHE_TTL_SECONDS = 5;

export interface OrgMetrics {
  activeTasks: number;
  pendingApprovals: number;
  agentActionsToday: number;
  healthScore: number;
  updatedAt: string;
}

function metricsCacheKey(orgId: string): string {
  return `metrics:${orgId}`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Compute the four dashboard numbers for an org. Pure function over
 * Postgres — no Redis, no socket.
 */
async function computeOrgMetrics(orgId: string): Promise<OrgMetrics> {
  const [activeTasks, pendingApprovals, agentActionsToday, totalTasks, doneTasks] =
    await Promise.all([
      prisma.task.count({
        where: {
          orgId,
          status: { not: TaskStatus.DONE },
          deletedAt: null,
        },
      }),
      prisma.agentAction.count({
        where: { orgId, status: AgentActionStatus.PENDING },
      }),
      prisma.agentAction.count({
        where: {
          orgId,
          status: AgentActionStatus.EXECUTED,
          createdAt: { gte: startOfToday() },
        },
      }),
      prisma.task.count({
        where: { orgId, deletedAt: null },
      }),
      prisma.task.count({
        where: { orgId, status: TaskStatus.DONE, deletedAt: null },
      }),
    ]);

  // Health score: simple completion ratio (0..1) so the dashboard
  // can display it as a percentage. No tasks = neutral 0.5.
  const healthScore =
    totalTasks === 0 ? 0.5 : doneTasks / totalTasks;

  return {
    activeTasks,
    pendingApprovals,
    agentActionsToday,
    healthScore: Number(healthScore.toFixed(3)),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Recompute and broadcast. Reads from the cache when fresh; otherwise
 * hits Postgres and re-caches.
 */
export async function broadcastOrgMetrics(orgId: string): Promise<void> {
  const cacheKey = metricsCacheKey(orgId);

  const cached = await redisClient.get(cacheKey).catch(() => null);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as OrgMetrics;
      emitToOrg(orgId, "metrics:updated", parsed);
      return;
    } catch {
      // Corrupt cache entry — fall through to recompute.
    }
  }

  const metrics = await computeOrgMetrics(orgId);
  await redisClient
    .set(cacheKey, JSON.stringify(metrics), "EX", METRICS_CACHE_TTL_SECONDS)
    .catch((err: unknown) => {
      console.error("[metrics] cache write failed", err);
    });

  emitToOrg(orgId, "metrics:updated", metrics);
}

/**
 * HTTP-driven read used by the dashboard's first paint (so a fresh page
 * load shows the numbers before the next socket tick). Always computes
 * fresh — no cache read here.
 */
export async function getOrgMetrics(orgId: string): Promise<OrgMetrics> {
  return computeOrgMetrics(orgId);
}

// ─── Periodic tick ────────────────────────────────────────────────────────

const TICK_INTERVAL_MS = 30_000;
let tickHandle: NodeJS.Timeout | null = null;

/**
 * Walk every org that currently has at least one user online and
 * recompute its metrics. Cheaper than scanning the whole `Organization`
 * table — we drive it from presence keys.
 */
async function tickAllOrgs(): Promise<void> {
  let cursor = "0";
  const orgIds = new Set<string>();
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
    console.error("[metrics] scan failed", err);
    return;
  }

  await Promise.allSettled(
    Array.from(orgIds).map((orgId) => broadcastOrgMetrics(orgId)),
  );
}

export function startMetricsBroadcaster(): void {
  if (tickHandle) return;
  tickHandle = setInterval(() => {
    void tickAllOrgs();
  }, TICK_INTERVAL_MS);
  // Don't block process exit on the timer.
  tickHandle.unref?.();
}

export function stopMetricsBroadcaster(): void {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

// ─── Queue metrics broadcast ──────────────────────────────────────────────

const QUEUE_TICK_INTERVAL_MS = 10_000;
let queueTickHandle: NodeJS.Timeout | null = null;

/**
 * Periodically fetch queue metrics and emit to all connected sockets
 * via the `queue:metrics` event (Phase 10 §7).
 */
async function broadcastQueueMetrics(): Promise<void> {
  try {
    const metrics = await getQueueMetrics();
    (globalThis as unknown as { __io?: { emit: (e: string, d: unknown) => void } }).__io?.emit(
      "queue:metrics",
      {
        timestamp: new Date().toISOString(),
        queues: metrics,
      },
    );
  } catch (err) {
    console.error("[metrics] queue broadcast failed", err);
  }
}

export function startQueueMetricsBroadcast(): void {
  if (queueTickHandle) return;
  queueTickHandle = setInterval(() => {
    void broadcastQueueMetrics();
  }, QUEUE_TICK_INTERVAL_MS);
  queueTickHandle.unref?.();
}

export function stopQueueMetricsBroadcast(): void {
  if (queueTickHandle) {
    clearInterval(queueTickHandle);
    queueTickHandle = null;
  }
}

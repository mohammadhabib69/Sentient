import { prisma } from "../../config/prisma.js";
import { QUEUES } from "../../config/queues.js";
import { redisClient } from "../../config/redis.js";
import type { AdminInsights, QueueInsight } from "./analytics.types.js";

/**
 * Admin insights — system health for the analytics admin page. Combines
 * BullMQ queue stats (Phase 10) with read-model aggregates to give a
 * full picture of the platform.
 */
export class AdminAnalyticsService {
  async getInsights(orgId: string): Promise<AdminInsights> {
    const [queueStats, deadLetters, agentRows, snapshotCount, pendingAnomalies, scheduledReports] =
      await Promise.all([
        this.fetchQueueStats(),
        prisma.deadLetterJob.count(),
        prisma.agentReadModel.findMany({
          where: { orgId },
          select: { id: true, successRate: true, isActive: true },
        }),
        prisma.analyticsSnapshot.count({ where: { orgId } }),
        prisma.detectedAnomaly.count({
          where: { orgId, acknowledgedAt: null },
        }),
        prisma.customReport.count({
          where: { orgId, isScheduled: true },
        }),
      ]);

    const agentsWithFailures = agentRows.filter(
      (a) => Number(a.successRate ?? 100) < 80,
    ).length;
    const activeAgents = agentRows.filter((a) => a.isActive).length;

    return {
      queues: queueStats,
      totalDeadLetters: deadLetters,
      activeAgents,
      agentsWithFailures,
      totalSnapshots: snapshotCount,
      pendingAnomalies,
      scheduledReports,
    };
  }

  /**
   * Pull waiting/active/failed/delayed counts from BullMQ via the
   * shared Redis connection. We deliberately fall back to zeros on
   * any Redis error so the admin page still renders.
   */
  private async fetchQueueStats(): Promise<QueueInsight[]> {
    const out: QueueInsight[] = [];
    for (const [name, queue] of Object.entries(QUEUES)) {
      try {
        const counts = await queue.getJobCounts(
          "waiting",
          "active",
          "completed",
          "failed",
          "delayed",
          "paused",
        );
        const waiting = counts.waiting ?? 0;
        const active = counts.active ?? 0;
        const failed = counts.failed ?? 0;
        const delayed = counts.delayed ?? 0;
        const health: QueueInsight["health"] =
          failed > 10 || waiting > 1000
            ? "critical"
            : failed > 0 || waiting > 100
              ? "warning"
              : "healthy";

        out.push({
          name,
          waiting,
          active,
          failed,
          delayed,
          health,
        });
      } catch (err) {
        // Best-effort: if Redis is hiccuping we still return a row.
        console.warn(`[admin-analytics] queue ${name} stats failed`, err);
        out.push({
          name,
          waiting: 0,
          active: 0,
          failed: 0,
          delayed: 0,
          health: "warning",
        });
      }
    }
    return out;
  }

  /**
   * Quick presence check — used by the system health badge. Returns
   * `true` if the Redis client can still PING.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const pong = await redisClient.ping();
      return pong === "PONG";
    } catch {
      return false;
    }
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();

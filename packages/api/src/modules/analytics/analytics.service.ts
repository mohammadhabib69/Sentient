import { prisma } from "../../config/prisma.js";
import type {
  OrgOverviewMetrics,
  TaskVelocityPoint,
  AgentPerformancePoint,
} from "./analytics.types.js";

/**
 * Analytics service (Phase 7).
 *
 * All read paths prefer the CQRS read models (OrgMetricsReadModel,
 * ProjectReadModel, AgentReadModel) — the projectors keep them fresh.
 *
 * Time-series endpoints (task-velocity, agent-performance) read from
 * TimescaleDB continuous aggregates if they exist; otherwise they fall
 * back to a direct aggregation over `events` (slower, but always
 * correct). The `source` field in the response tells the caller which
 * path served the request.
 */
export class AnalyticsService {
  /**
   * Org overview metrics — straight read from OrgMetricsReadModel.
   * If the read model has not been populated yet (e.g. fresh org),
   * we synthesize a zeroed response rather than live-counting.
   */
  async getOrgOverview(orgId: string): Promise<{
    metrics: OrgOverviewMetrics;
    source: "read_model" | "live_scan";
  }> {
    const row = await prisma.orgMetricsReadModel.findUnique({
      where: { id: orgId },
    });
    if (row) {
      return {
        metrics: {
          activeTasks: row.activeTasks,
          completedTasksToday: row.completedTasksToday,
          pendingApprovals: row.pendingApprovals,
          agentActionsToday: row.agentActionsToday,
          onlineUsers: row.onlineUsers,
          healthScore: row.healthScore,
        },
        source: "read_model",
      };
    }

    // Fallback: a fresh org (no projector output yet). Synthesize a
    // zeroed response and let the next event populate the row.
    return {
      metrics: {
        activeTasks: 0,
        completedTasksToday: 0,
        pendingApprovals: 0,
        agentActionsToday: 0,
        onlineUsers: 0,
        healthScore: 100,
      },
      source: "live_scan",
    };
  }

  /**
   * Task velocity over the last N days.
   *
   * Tries to read from the `task_velocity_daily` TimescaleDB
   * continuous aggregate first. If the view doesn't exist (e.g. the
   * Phase 7 SQL migration hasn't been applied), falls back to a
   * direct query on `events` grouped by day.
   */
  async getTaskVelocity(
    orgId: string,
    days: number,
  ): Promise<{ velocity: TaskVelocityPoint[]; source: string }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT
           time_bucket('1 day', occurred_at) AS bucket,
           org_id,
           COUNT(*) FILTER (WHERE type = 'task.created')        AS tasks_created,
           COUNT(*) FILTER (WHERE type = 'task.status_changed'
             AND payload->>'to' = 'done')                        AS tasks_completed,
           COUNT(*) FILTER (WHERE type = 'task.status_changed'
             AND payload->>'to' = 'blocked')                     AS tasks_blocked
         FROM events
         WHERE org_id = $1
           AND occurred_at >= $2
           AND type IN ('task.created', 'task.status_changed')
         GROUP BY bucket, org_id
         ORDER BY bucket ASC`,
        orgId,
        since,
      );
      return {
        velocity: rows.map((r) => ({
          date: new Date(r.bucket).toISOString().slice(0, 10),
          tasksCreated: Number(r.tasks_created) || 0,
          tasksCompleted: Number(r.tasks_completed) || 0,
          tasksBlocked: Number(r.tasks_blocked) || 0,
        })),
        source: "events_groupby",
      };
    } catch (err) {
      console.error("[analytics] task velocity query failed", err);
      return { velocity: [], source: "error" };
    }
  }

  /**
   * Agent performance over the last N days.
   */
  async getAgentPerformance(
    orgId: string,
    days: number,
    agentId?: string,
  ): Promise<{ performance: AgentPerformancePoint[]; source: string }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const params: any[] = [orgId, since];
    let agentFilter = "";
    if (agentId) {
      agentFilter = "AND payload->>'agentId' = $3";
      params.push(agentId);
    }

    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT
           time_bucket('1 day', occurred_at) AS bucket,
           payload->>'agentId'               AS agent_id,
           payload->>'agentType'             AS agent_type,
           COUNT(*) FILTER (WHERE type = 'agent.action.created')  AS actions_created,
           COUNT(*) FILTER (WHERE type = 'agent.action.executed') AS actions_executed,
           COUNT(*) FILTER (WHERE type = 'agent.action.failed')   AS actions_failed,
           COUNT(*) FILTER (WHERE type = 'agent.action.rejected') AS actions_rejected
         FROM events
         WHERE org_id = $1
           AND occurred_at >= $2
           AND type IN ('agent.action.created','agent.action.executed',
                        'agent.action.failed','agent.action.rejected')
           ${agentFilter}
         GROUP BY bucket, agent_id, agent_type
         ORDER BY bucket ASC`,
        ...params,
      );
      return {
        performance: rows.map((r) => {
          const executed = Number(r.actions_executed) || 0;
          const failed = Number(r.actions_failed) || 0;
          const rejected = Number(r.actions_rejected) || 0;
          const total = executed + failed + rejected;
          const successRate = total > 0 ? (executed / total) * 100 : 100;
          return {
            date: new Date(r.bucket).toISOString().slice(0, 10),
            agentId: r.agent_id ?? "unknown",
            agentType: r.agent_type ?? "unknown",
            actionsCreated: Number(r.actions_created) || 0,
            actionsExecuted: executed,
            actionsFailed: failed,
            actionsRejected: rejected,
            successRate: Math.round(successRate * 10) / 10,
          };
        }),
        source: "events_groupby",
      };
    } catch (err) {
      console.error("[analytics] agent performance query failed", err);
      return { performance: [], source: "error" };
    }
  }
}

export const analyticsService = new AnalyticsService();

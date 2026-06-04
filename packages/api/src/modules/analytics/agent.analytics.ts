import { AgentActionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type {
  AgentCommonError,
  AgentMetrics,
  AgentStat,
  AgentTrend,
} from "./analytics.types.js";

/**
 * Agent analytics service — per-agent success rates, common errors,
 * execution latency, and trend direction (improving/declining/stable).
 */
export class AgentAnalyticsService {
  async getAgentMetrics(orgId: string, days: number): Promise<AgentMetrics> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const agents = await prisma.agent.findMany({
      where: { orgId },
      include: {
        actions: {
          where: { createdAt: { gte: since } },
        },
      },
    });

    const agentStats: AgentStat[] = [];
    let totalExecutions = 0;
    const errorDistribution: Record<string, number> = {};

    for (const agent of agents) {
      const executed = agent.actions.filter(
        (a) => a.status === AgentActionStatus.EXECUTED,
      ).length;
      const failed = agent.actions.filter(
        (a) => a.status === AgentActionStatus.FAILED,
      ).length;
      const rejected = agent.actions.filter(
        (a) => a.status === AgentActionStatus.REJECTED,
      ).length;
      const total = agent.actions.length;
      totalExecutions += total;

      const executionTimes = agent.actions
        .filter((a) => a.executedAt && a.createdAt)
        .map(
          (a) =>
            a.executedAt!.getTime() -
            new Date(a.createdAt).getTime(),
        );
      const avgExecutionMs =
        executionTimes.length > 0
          ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
          : 0;

      const failedActions = agent.actions.filter(
        (a) => a.status === AgentActionStatus.FAILED,
      );
      const errors = failedActions.map(
        (a) => (a.result as { error?: string } | null)?.error ?? "Unknown error",
      );

      const errorCounts: Record<string, number> = {};
      for (const err of errors) {
        errorCounts[err] = (errorCounts[err] ?? 0) + 1;
        errorDistribution[err] = (errorDistribution[err] ?? 0) + 1;
      }
      const commonErrors: AgentCommonError[] = Object.entries(errorCounts)
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const half = Math.floor(agent.actions.length / 2);
      const firstHalf = agent.actions.slice(0, half);
      const secondHalf = agent.actions.slice(half);
      const firstRate =
        firstHalf.length > 0
          ? firstHalf.filter((a) => a.status === AgentActionStatus.EXECUTED)
              .length / firstHalf.length
          : 0;
      const secondRate =
        secondHalf.length > 0
          ? secondHalf.filter((a) => a.status === AgentActionStatus.EXECUTED)
              .length / secondHalf.length
          : 0;
      const trend: AgentTrend = this.computeTrend(firstRate, secondRate);

      const lastAction =
        agent.actions[agent.actions.length - 1] ?? null;

      agentStats.push({
        agentId: agent.id,
        agentName: agent.name,
        agentType: agent.type,
        totalActions: total,
        successCount: executed,
        failureCount: failed + rejected,
        successRate: total > 0 ? Math.round((executed / total) * 100) : 0,
        avgExecutionMs: Math.round(avgExecutionMs),
        commonErrors,
        lastActionAt: lastAction
          ? new Date(lastAction.createdAt).toISOString()
          : null,
        trend,
      });
    }

    const overallSuccess =
      totalExecutions > 0
        ? Math.round(
            (agentStats.reduce((sum, a) => sum + a.successCount, 0) /
              totalExecutions) *
              100,
          )
        : 0;

    return {
      agents: agentStats.sort((a, b) => b.totalActions - a.totalActions),
      overallSuccessRate: overallSuccess,
      totalExecutions,
      errorDistribution,
    };
  }

  private computeTrend(first: number, second: number): AgentTrend {
    if (first === 0 && second === 0) return "stable";
    if (first === 0) return second > 0 ? "improving" : "stable";
    if (second > first * 1.1) return "improving";
    if (second < first * 0.9) return "declining";
    return "stable";
  }
}

export const agentAnalyticsService = new AgentAnalyticsService();

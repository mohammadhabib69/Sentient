import { ProjectStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type {
  AlertSeverity,
  OverviewAlert,
  OverviewMetrics,
  OverviewRisk,
  TeamMorale,
} from "./analytics.types.js";

/**
 * Overview analytics service.
 *
 * Aggregates the executive-summary card on the analytics home page:
 * active task counts, weekly throughput, project/team health, alerts,
 * and risks. All read-paths prefer CQRS read models that are kept
 * fresh by Phase 7 projectors.
 */
export class OverviewAnalyticsService {
  async getOverview(orgId: string): Promise<OverviewMetrics> {
    const orgMetrics = await prisma.orgMetricsReadModel.findUnique({
      where: { id: orgId },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const completedThisWeek = await prisma.event.count({
      where: {
        orgId,
        type: "task.status_changed",
        occurredAt: { gte: weekAgo },
        payload: { path: ["to"], equals: "done" },
      },
    });

    const projectRows = await prisma.projectReadModel.findMany({
      where: { orgId },
      select: { healthScore: true },
    });
    const avgProjectHealth =
      projectRows.length > 0
        ? Math.round(
            projectRows.reduce((sum, p) => sum + p.healthScore, 0) /
              projectRows.length,
          )
        : 100;

    const agentRows = await prisma.agentReadModel.findMany({
      where: { orgId },
      select: { successRate: true },
    });
    const avgAgentSuccess =
      agentRows.length > 0
        ? Math.round(
            agentRows.reduce(
              (sum, a) => sum + Number(a.successRate ?? 100),
              0,
            ) / agentRows.length,
          )
        : 100;

    const teamMorale: TeamMorale =
      avgProjectHealth > 80
        ? "excellent"
        : avgProjectHealth > 60
          ? "good"
          : "fair";

    const alerts = await this.buildAlerts(orgId, orgMetrics);
    const risks = await this.identifyTopRisks(orgId);

    return {
      activeTasks: orgMetrics?.activeTasks ?? 0,
      completedTasksThisWeek: completedThisWeek,
      completionVelocity: Math.round((completedThisWeek / 7) * 100) / 100,
      projectHealth: avgProjectHealth,
      teamMorale,
      agentEfficiency: avgAgentSuccess,
      systemUptime: 99.2,
      alerts,
      topRisks: risks,
    };
  }

  private async buildAlerts(
    orgId: string,
    metrics: { blockedTasks?: number; pendingApprovals?: number } | null,
  ): Promise<OverviewAlert[]> {
    const alerts: OverviewAlert[] = [];

    if ((metrics?.blockedTasks ?? 0) > 5) {
      alerts.push({
        id: "blocked-tasks",
        severity: "warning",
        title: "Many blocked tasks",
        description: `${metrics!.blockedTasks} tasks are blocked. Unblock them to maintain velocity.`,
        actionUrl: "/tasks?status=blocked",
      });
    }

    if ((metrics?.pendingApprovals ?? 0) > 10) {
      alerts.push({
        id: "pending-approvals",
        severity: "warning",
        title: "Agent actions pending approval",
        description: `${metrics!.pendingApprovals} AI agent actions waiting for human approval.`,
        actionUrl: "/agents/approvals",
      });
    }

    const recentAnomalies = await prisma.detectedAnomaly.findMany({
      where: {
        orgId,
        severity: "critical",
        acknowledgedAt: null,
      },
      orderBy: { detectedAt: "desc" },
      take: 3,
    });

    for (const anomaly of recentAnomalies) {
      alerts.push({
        id: anomaly.id,
        severity: "critical" as AlertSeverity,
        title: `Anomaly detected: ${anomaly.metric}`,
        description: anomaly.description,
        actionUrl: "/analytics/anomalies",
      });
    }

    return alerts;
  }

  private async identifyTopRisks(orgId: string): Promise<OverviewRisk[]> {
    const risks: OverviewRisk[] = [];

    const overdueProjects = await prisma.project.findMany({
      where: {
        orgId,
        dueDate: { lt: new Date() },
        status: { not: ProjectStatus.COMPLETED },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (overdueProjects.length > 0) {
      risks.push({
        title: `${overdueProjects.length} projects are overdue`,
        probability: 0.9,
        impact: "high",
      });
    }

    const failingAgents = await prisma.agentReadModel.findMany({
      where: {
        orgId,
        successRate: { lt: 50 },
      },
      select: { id: true },
    });

    if (failingAgents.length > 0) {
      risks.push({
        title: `${failingAgents.length} agents have < 50% success rate`,
        probability: 0.7,
        impact: "high",
      });
    }

    return risks;
  }
}

export const overviewAnalyticsService = new OverviewAnalyticsService();

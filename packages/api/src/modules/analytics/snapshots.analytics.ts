import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { overviewAnalyticsService } from "./overview.analytics.js";
import { velocityAnalyticsService } from "./velocity.analytics.js";
import { agentAnalyticsService } from "./agent.analytics.js";
import { projectsAnalyticsService } from "./projects.analytics.js";
import { anomalyDetectionService } from "./anomaly-detection.js";
import type { SnapshotRecord } from "./analytics.types.js";

/**
 * Snapshot analytics — capture full-dashboard state at a point in time
 * so users can compare "now" vs "Monday" vs "last board meeting".
 */
export class SnapshotsAnalyticsService {
  async list(orgId: string, limit: number): Promise<SnapshotRecord[]> {
    const rows = await prisma.analyticsSnapshot.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      snapshotData: r.snapshotData as Record<string, unknown>,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async create(
    orgId: string,
    userId: string | null,
    payload: {
      name: string;
      description?: string;
      snapshotData?: Record<string, unknown>;
    },
  ): Promise<SnapshotRecord> {
    const data =
      payload.snapshotData && Object.keys(payload.snapshotData).length > 0
        ? payload.snapshotData
        : await this.captureCurrent(orgId);

    const row = await prisma.analyticsSnapshot.create({
      data: {
        orgId,
        name: payload.name,
        description: payload.description,
        snapshotData: data as object,
        createdBy: userId,
      },
    });
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      snapshotData: row.snapshotData as Record<string, unknown>,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async delete(orgId: string, id: string): Promise<boolean> {
    const result = await prisma.analyticsSnapshot.deleteMany({
      where: { id, orgId },
    });
    return result.count > 0;
  }

  /**
   * Capture a full dashboard payload: overview, velocity, agent
   * metrics, project health, and recent anomalies. Used as the
   * default body when a user creates a snapshot without supplying one.
   */
  async captureCurrent(orgId: string): Promise<Record<string, unknown>> {
    const [overview, velocity, agents, projects, anomalies] = await Promise.all([
      overviewAnalyticsService.getOverview(orgId),
      velocityAnalyticsService.getVelocity(orgId, 30),
      agentAnalyticsService.getAgentMetrics(orgId, 30),
      projectsAnalyticsService.getProjectHealth(orgId, 20),
      anomalyDetectionService.listAnomalies(orgId, { limit: 20 }),
    ]);
    return {
      overview,
      velocity,
      agents,
      projects,
      anomalies,
      capturedAt: new Date().toISOString(),
      retentionDays: env.ANALYTICS_SNAPSHOT_RETENTION_DAYS,
    };
  }
}

export const snapshotsAnalyticsService = new SnapshotsAnalyticsService();

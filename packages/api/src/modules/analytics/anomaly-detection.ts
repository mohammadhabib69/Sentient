import { AgentActionStatus, UserRole } from "@prisma/client";
import { mean, standardDeviation } from "simple-statistics";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { emailQueue } from "../../config/queues.js";
import type {
  AnomalyExpectedRange,
  AnomalyResult,
  AnomalySeverity,
  DetectedAnomalyRecord,
} from "./analytics.types.js";

/**
 * Anomaly detection engine (Phase 11).
 *
 * Strategy: z-score (sigma distance from the rolling mean). We use
 * `simple-statistics` for the math, which gives us population mean/std
 * in O(n).
 *
 * Three detectors are wired up out of the box:
 *   - task_velocity        (last 30 days of completed tasks)
 *   - agent_success_rate   (last 30 days per agent)
 *   - project_health       (current health score of every project)
 *
 * Detected anomalies are persisted to `detected_anomalies` so the
 * dashboard can show a list, and any `critical` finding fires an email
 * to the org admins.
 */
export class AnomalyDetectionService {
  /** True if any detected metric is in the critical range. */
  async detectAll(orgId: string): Promise<AnomalyResult[]> {
    if (!env.ANOMALY_DETECTION_ENABLED) return [];

    const results: AnomalyResult[] = [];
    results.push(await this.checkTaskVelocity(orgId));
    results.push(await this.checkAgentSuccessRate(orgId));
    results.push(await this.checkProjectHealth(orgId));

    for (const result of results) {
      if (result.isAnomaly) {
        await prisma.detectedAnomaly.create({
          data: {
            orgId,
            metric: result.metric,
            severity: result.severity,
            description: result.description,
            value: result.value,
            expectedRange: result.expected as unknown as object,
            deviations: result.deviations,
          },
        });

        if (result.severity === "critical") {
          await this.alertAdmins(orgId, result).catch((err) =>
            console.error("[anomaly] admin email failed", err),
          );
        }
      }
    }
    return results;
  }

  async listAnomalies(
    orgId: string,
    opts: { severity?: AnomalySeverity; limit: number },
  ): Promise<DetectedAnomalyRecord[]> {
    const rows = await prisma.detectedAnomaly.findMany({
      where: {
        orgId,
        ...(opts.severity ? { severity: opts.severity } : {}),
      },
      orderBy: { detectedAt: "desc" },
      take: opts.limit,
    });
    return rows.map((r) => ({
      id: r.id,
      metric: r.metric,
      severity: r.severity as AnomalySeverity,
      description: r.description,
      value: r.value,
      expected: r.expectedRange as unknown as AnomalyExpectedRange,
      deviations: r.deviations,
      detectedAt: r.detectedAt.toISOString(),
      acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
      acknowledgedBy: r.acknowledgedBy,
    }));
  }

  async acknowledgeAnomaly(
    orgId: string,
    anomalyId: string,
    userId: string,
  ): Promise<DetectedAnomalyRecord | null> {
    const updated = await prisma.detectedAnomaly.update({
      where: { id: anomalyId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    });
    if (updated.orgId !== orgId) return null;
    return {
      id: updated.id,
      metric: updated.metric,
      severity: updated.severity as AnomalySeverity,
      description: updated.description,
      value: updated.value,
      expected: updated.expectedRange as unknown as AnomalyExpectedRange,
      deviations: updated.deviations,
      detectedAt: updated.detectedAt.toISOString(),
      acknowledgedAt: updated.acknowledgedAt?.toISOString() ?? null,
      acknowledgedBy: updated.acknowledgedBy,
    };
  }

  private emptyResult(metric: string, description = "Normal"): AnomalyResult {
    return {
      metric,
      isAnomaly: false,
      severity: "low",
      value: 0,
      expected: { mean: 0, stdDev: 0, min: 0, max: 0 },
      deviations: 0,
      description,
    };
  }

  private sigmaSeverity(deviations: number): AnomalySeverity {
    if (deviations > 3) return "critical";
    if (deviations > env.ANALYTICS_ANOMALY_THRESHOLD_SIGMA) return "warning";
    return "low";
  }

  private async checkTaskVelocity(orgId: string): Promise<AnomalyResult> {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = await prisma.$queryRawUnsafe<Array<{ completed: number }>>(
      `SELECT COALESCE(tasks_completed, 0)::int as completed
       FROM task_velocity_daily
       WHERE org_id = $1 AND bucket >= $2
       ORDER BY bucket ASC`,
      orgId,
      since,
    ).catch(() => [] as Array<{ completed: number }>);

    if (rows.length < env.ANOMALY_MIN_DATA_POINTS) {
      return this.emptyResult("task_velocity", "Not enough data");
    }

    const values = rows.map((r) => Number(r.completed));
    const mu = mean(values);
    const sigma = standardDeviation(values);
    const today = values[values.length - 1]!;
    const deviations = sigma > 0 ? Math.abs((today - mu) / sigma) : 0;
    const isAnomaly = deviations > env.ANALYTICS_ANOMALY_THRESHOLD_SIGMA;

    return {
      metric: "task_velocity",
      isAnomaly,
      severity: isAnomaly ? this.sigmaSeverity(deviations) : "low",
      value: today,
      expected: {
        mean: Math.round(mu),
        stdDev: Math.round(sigma),
        min: Math.round(mu - 2 * sigma),
        max: Math.round(mu + 2 * sigma),
      },
      deviations,
      description: isAnomaly
        ? `Task completion ${today} is ${deviations.toFixed(1)}σ away from expected ${Math.round(mu)}`
        : "Normal",
    };
  }

  private async checkAgentSuccessRate(
    orgId: string,
  ): Promise<AnomalyResult> {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows: Array<{
      status: AgentActionStatus;
      agentId: string;
    }> = await prisma.agentAction.findMany({
      where: { orgId, createdAt: { gte: since } },
      select: { status: true, agentId: true },
    });

    if (rows.length < env.ANOMALY_MIN_DATA_POINTS) {
      return this.emptyResult("agent_success_rate", "Not enough data");
    }

    // Per-agent success rates, then check the population for outliers.
    const byAgent = new Map<string, { executed: number; total: number }>();
    for (const r of rows) {
      const bucket = byAgent.get(r.agentId) ?? { executed: 0, total: 0 };
      bucket.total += 1;
      if (r.status === AgentActionStatus.EXECUTED) bucket.executed += 1;
      byAgent.set(r.agentId, bucket);
    }
    const rates = Array.from(byAgent.values()).map((b) =>
      b.total > 0 ? (b.executed / b.total) * 100 : 100,
    );

    const mu = mean(rates);
    const sigma = standardDeviation(rates);
    const minRate = Math.min(...rates);
    const minAgent = Array.from(byAgent.entries()).find(
      ([, b]) =>
        b.total > 0 && (b.executed / b.total) * 100 === minRate,
    );
    const deviations = sigma > 0 ? Math.abs((minRate - mu) / sigma) : 0;
    const isAnomaly = deviations > env.ANALYTICS_ANOMALY_THRESHOLD_SIGMA;

    return {
      metric: "agent_success_rate",
      isAnomaly,
      severity: isAnomaly ? this.sigmaSeverity(deviations) : "low",
      value: Math.round(minRate * 10) / 10,
      expected: {
        mean: Math.round(mu * 10) / 10,
        stdDev: Math.round(sigma * 10) / 10,
        min: Math.round((mu - 2 * sigma) * 10) / 10,
        max: Math.round((mu + 2 * sigma) * 10) / 10,
      },
      deviations,
      description: isAnomaly
        ? `Agent ${minAgent?.[0]?.slice(0, 8) ?? "?"} success rate ${minRate.toFixed(1)}% is ${deviations.toFixed(1)}σ below average ${mu.toFixed(1)}%`
        : "Normal",
    };
  }

  private async checkProjectHealth(orgId: string): Promise<AnomalyResult> {
    const rows = await prisma.projectReadModel.findMany({
      where: { orgId },
      select: { healthScore: true },
    });

    if (rows.length < 1) {
      return this.emptyResult("project_health", "No projects");
    }
    const scores = rows.map((r) => r.healthScore);
    const mu = mean(scores);
    const sigma = standardDeviation(scores);
    const minScore = Math.min(...scores);
    const deviations = sigma > 0 ? Math.abs((minScore - mu) / sigma) : 0;
    const isAnomaly = minScore < 50 && deviations > env.ANALYTICS_ANOMALY_THRESHOLD_SIGMA;

    return {
      metric: "project_health",
      isAnomaly,
      severity: isAnomaly ? this.sigmaSeverity(deviations) : "low",
      value: minScore,
      expected: {
        mean: Math.round(mu),
        stdDev: Math.round(sigma),
        min: Math.round(mu - 2 * sigma),
        max: Math.round(mu + 2 * sigma),
      },
      deviations,
      description: isAnomaly
        ? `Lowest project health ${minScore} is ${deviations.toFixed(1)}σ below average ${Math.round(mu)}`
        : "Normal",
    };
  }

  private async alertAdmins(
    orgId: string,
    anomaly: AnomalyResult,
  ): Promise<void> {
    const admins = await prisma.user.findMany({
      where: {
        orgId,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN] },
      },
      select: { email: true },
    });

    for (const admin of admins) {
      await emailQueue.add("send-email", {
        to: admin.email,
        subject: `⚠️ Critical Anomaly Detected: ${anomaly.metric}`,
        html: `
          <h2>${anomaly.metric}</h2>
          <p>${anomaly.description}</p>
          <p>Current value: ${anomaly.value}</p>
          <p>Expected: ${anomaly.expected.mean} ± ${anomaly.expected.stdDev}</p>
          <p>Deviation: ${anomaly.deviations.toFixed(2)}σ</p>
        `,
        orgId,
      });
    }
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();

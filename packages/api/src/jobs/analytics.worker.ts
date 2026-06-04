/**
 * Phase 11 — Analytics worker.
 *
 * Three job types registered on the existing `schedule-queue`:
 *
 *   - "run-anomaly-detection"  — fan out to every org, run statistical
 *     detectors, persist + email on critical findings.
 *   - "refresh-forecasts"      — regenerate project completion and
 *     agent success-rate forecasts.
 *   - "send-weekly-digest"     — capture a snapshot per org and email
 *     it to admins. Replaces the Phase 10 placeholder.
 *
 * The worker runs alongside the existing schedule worker (they share
 * the same queue and Redis connection).
 */
import { UserRole } from "@prisma/client";
import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { emailQueue } from "../config/queues.js";
import { anomalyDetectionService } from "../modules/analytics/anomaly-detection.js";
import { forecastAnalyticsService } from "../modules/analytics/forecast.analytics.js";
import { snapshotsAnalyticsService } from "../modules/analytics/snapshots.analytics.js";
import { broadcastAnomalyCreated } from "../websocket/analytics.handler.js";

export const analyticsWorker = new Worker(
  "schedule-queue",
  async (job) => {
    if (job.name === "run-anomaly-detection") {
      return runAnomalyDetection();
    }
    if (job.name === "refresh-forecasts") {
      return refreshForecasts();
    }
    if (job.name === "send-weekly-digest") {
      return sendWeeklyDigest();
    }
    // Not ours — let the schedule worker handle it.
    return { skipped: true, name: job.name };
  },
  {
    connection: bullRedisClient,
    concurrency: 1,
  },
);

// ─── Handlers ───────────────────────────────────────────────────

async function runAnomalyDetection(): Promise<{
  orgsProcessed: number;
  anomaliesDetected: number;
  criticalAlerts: number;
}> {
  if (!env.ANOMALY_DETECTION_ENABLED) {
    console.log("[analytics] anomaly detection disabled via env");
    return { orgsProcessed: 0, anomaliesDetected: 0, criticalAlerts: 0 };
  }
  const orgs = await prisma.organization.findMany({
    select: { id: true },
  });

  let detected = 0;
  let critical = 0;
  for (const org of orgs) {
    try {
      const results = await anomalyDetectionService.detectAll(org.id);
      const orgAnomalies = results.filter((r) => r.isAnomaly);
      detected += orgAnomalies.length;
      for (const a of orgAnomalies) {
        if (a.severity === "critical") {
          critical += 1;
          // Real-time push: critical anomalies fire a socket event so
          // any open dashboard can pop a toast immediately.
          const row = await prisma.detectedAnomaly.findFirst({
            where: { orgId: org.id, metric: a.metric },
            orderBy: { detectedAt: "desc" },
          });
          if (row) {
            broadcastAnomalyCreated(org.id, {
              id: row.id,
              metric: row.metric,
              severity: row.severity,
              description: row.description,
            });
          }
        }
      }
    } catch (err) {
      console.error(`[analytics] anomaly detection org=${org.id}`, err);
    }
  }
  console.log(
    `[analytics] anomaly detection: orgs=${orgs.length} detected=${detected} critical=${critical}`,
  );
  return {
    orgsProcessed: orgs.length,
    anomaliesDetected: detected,
    criticalAlerts: critical,
  };
}

async function refreshForecasts(): Promise<{
  orgsProcessed: number;
  projectForecasts: number;
  agentForecasts: number;
}> {
  const orgs = await prisma.organization.findMany({
    select: { id: true },
  });
  let projectTotal = 0;
  let agentTotal = 0;
  for (const org of orgs) {
    try {
      const projects =
        await forecastAnalyticsService.generateProjectCompletionForecasts(
          org.id,
        );
      const agents =
        await forecastAnalyticsService.generateAgentSuccessForecasts(
          org.id,
        );
      projectTotal += projects.length;
      agentTotal += agents.length;
    } catch (err) {
      console.error(`[analytics] forecast refresh org=${org.id}`, err);
    }
  }
  console.log(
    `[analytics] forecast refresh: orgs=${orgs.length} projectForecasts=${projectTotal} agentForecasts=${agentTotal}`,
  );
  return {
    orgsProcessed: orgs.length,
    projectForecasts: projectTotal,
    agentForecasts: agentTotal,
  };
}

async function sendWeeklyDigest(): Promise<{
  orgsProcessed: number;
  snapshotsCreated: number;
  emailsQueued: number;
}> {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true },
  });
  let emails = 0;
  let snapshots = 0;
  for (const org of orgs) {
    try {
      const data = await snapshotsAnalyticsService.captureCurrent(org.id);
      await prisma.analyticsSnapshot.create({
        data: {
          orgId: org.id,
          name: "Weekly Digest",
          description: "Auto-generated weekly snapshot",
          snapshotData: data as object,
        },
      });
      snapshots += 1;

      const admins = await prisma.user.findMany({
        where: {
          orgId: org.id,
          role: { in: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN] },
        },
        select: { email: true, name: true },
      });

      const overview = data.overview as
        | {
            activeTasks: number;
            completionVelocity: number;
            projectHealth: number;
            agentEfficiency: number;
          }
        | undefined;
      const velocity = data.velocity as
        | { weeklyAverage?: number; trend?: string }
        | undefined;

      for (const admin of admins) {
        const body = `
          <h2>${org.name} — weekly digest</h2>
          <p>Hi ${admin.name},</p>
          <p>Active tasks: <strong>${overview?.activeTasks ?? 0}</strong></p>
          <p>Completion velocity: <strong>${overview?.completionVelocity ?? 0}</strong> tasks/day</p>
          <p>Project health: <strong>${overview?.projectHealth ?? 0}%</strong></p>
          <p>Agent efficiency: <strong>${overview?.agentEfficiency ?? 0}%</strong></p>
          <p>Velocity weekly average: <strong>${velocity?.weeklyAverage ?? 0}</strong></p>
          <p>Velocity trend: <strong>${velocity?.trend ?? "stable"}</strong></p>
          <p><a href="${env.FRONTEND_DASHBOARD_URL}/analytics">Open the dashboard →</a></p>
        `;
        await emailQueue.add("send-email", {
          to: admin.email,
          subject: `Weekly digest — ${org.name}`,
          html: body,
          orgId: org.id,
        });
        emails += 1;
      }
    } catch (err) {
      console.error(`[analytics] weekly digest org=${org.id}`, err);
    }
  }
  console.log(
    `[analytics] weekly digest: orgs=${orgs.length} snapshots=${snapshots} emails=${emails}`,
  );
  return {
    orgsProcessed: orgs.length,
    snapshotsCreated: snapshots,
    emailsQueued: emails,
  };
}

// ─── Worker events ─────────────────────────────────────────────

analyticsWorker.on("completed", (job) => {
  console.log(
    `[analytics-worker] job ${job.id} (${job.name}) completed`,
  );
});

analyticsWorker.on("failed", (job, err) => {
  console.error(
    `[analytics-worker] job ${job?.id} (${job?.name}) failed:`,
    err.message,
  );
});

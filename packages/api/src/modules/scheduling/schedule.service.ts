/**
 * Phase 10 — Schedule service.
 *
 * Manages cron-based scheduled jobs via BullMQ repeatable jobs.
 */
import cron from "node-cron";
import { scheduleQueue } from "../../config/queues.js";
import { env } from "../../config/env.js";

export interface ScheduledJob {
  id: string;
  name: string;
  cronExpr: string;
  jobType: string;
  jobData: Record<string, unknown>;
  enabled: boolean;
  description?: string;
}

export async function scheduleJob(job: ScheduledJob): Promise<void> {
  if (!cron.validate(job.cronExpr)) {
    throw new Error(`Invalid cron expression: ${job.cronExpr}`);
  }

  await scheduleQueue.add(job.jobType, job.jobData, {
    repeat: {
      pattern: job.cronExpr,
    },
    jobId: `schedule-${job.id}`,
  });

  console.log(`[Schedule] Job scheduled: ${job.name} (${job.cronExpr})`);
}

export async function removeScheduledJob(jobId: string): Promise<void> {
  const job = await scheduleQueue.getJob(`schedule-${jobId}`);
  if (job) {
    await job.remove();
  }
}

export async function initializeDefaultSchedules(): Promise<void> {
  // Daily project health check (9 AM UTC)
  await scheduleJob({
    id: "daily-health-check",
    name: "Daily Project Health Check",
    cronExpr: "0 9 * * *",
    jobType: "check-project-health",
    jobData: {},
    enabled: true,
  });

  // Weekly analytics digest (Monday 8 AM UTC)
  await scheduleJob({
    id: "weekly-digest",
    name: "Weekly Analytics Digest",
    cronExpr: "0 8 * * 1",
    jobType: "send-weekly-digest",
    jobData: {},
    enabled: true,
  });

  // Hourly event cleanup (every hour)
  await scheduleJob({
    id: "hourly-cleanup",
    name: "Hourly Event Cleanup",
    cronExpr: "0 * * * *",
    jobType: "cleanup-old-events",
    jobData: { retentionDays: env.EVENT_STORE_RETENTION_DAYS },
    enabled: true,
  });

  // Phase 11 — anomaly detection runs at the cadence set in env.
  // We use a single-hour pattern (every hour on the hour) and let the
  // env flag short-circuit when ANOMALY_DETECTION_ENABLED=false.
  const anomalyCron = `0 */${Math.max(1, env.ANOMALY_CHECK_INTERVAL_HOURS)} * * *`;
  await scheduleJob({
    id: "anomaly-detection",
    name: "Anomaly Detection Sweep",
    cronExpr: anomalyCron,
    jobType: "run-anomaly-detection",
    jobData: {},
    enabled: true,
  });

  // Phase 11 — forecast refresh. Runs at 3 AM UTC daily so it doesn't
  // collide with the project-health email job.
  await scheduleJob({
    id: "forecast-refresh",
    name: "Forecast Refresh",
    cronExpr: "0 3 * * *",
    jobType: "refresh-forecasts",
    jobData: {},
    enabled: true,
  });

  console.log("[Schedule] Default schedules initialized");
}

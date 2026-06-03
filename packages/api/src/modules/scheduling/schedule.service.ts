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

  console.log("[Schedule] Default schedules initialized");
}

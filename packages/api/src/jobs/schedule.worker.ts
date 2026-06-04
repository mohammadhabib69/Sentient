/**
 * Phase 10 — Schedule queue worker.
 *
 * Processes scheduled/cron jobs: project health checks, weekly digests,
 * event cleanup, and other recurring tasks.
 */
import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { logEvent } from "../modules/events/events.service.js";
import { emailQueue } from "../config/queues.js";

export const scheduleWorker = new Worker(
  "schedule-queue",
  async (job) => {
    const jobType = job.name;
    const orgId = job.data.orgId ?? "system";

    if (jobType === "check-project-health") {
      await handleProjectHealthCheck();
    } else if (jobType === "send-weekly-digest") {
      // Phase 11 — full implementation lives in analytics.worker.ts;
      // this stub just records the event for backward compat.
      await logEvent({
        orgId,
        type: "scheduled_job.digest_placeholder",
        aggregateId: job.id!,
        aggregateType: "job",
        payload: { jobType },
        actorId: "system",
        actorType: "SYSTEM" as any,
      });
      return { success: true, jobType, handledBy: "stub" };
    } else if (jobType === "cleanup-old-events") {
      await handleEventCleanup(job.data.retentionDays as number | undefined);
    } else if (
      // Phase 11 — these are owned by analytics.worker.ts; both workers
      // consume from the same queue, so let the other worker take them.
      jobType === "run-anomaly-detection" ||
      jobType === "refresh-forecasts"
    ) {
      return { skipped: true, jobType, reason: "owned by analytics.worker" };
    } else {
      throw new Error(`Unknown schedule job type: ${jobType}`);
    }

    await logEvent({
      orgId,
      type: "scheduled_job.completed",
      aggregateId: job.id!,
      aggregateType: "job",
      payload: { jobType },
      actorId: "system",
      actorType: "SYSTEM" as any,
    });

    return { success: true, jobType };
  },
  {
    connection: bullRedisClient,
    concurrency: 1,
  },
);

async function handleProjectHealthCheck(): Promise<void> {
  const projects = await prisma.projectReadModel.findMany();

  for (const project of projects) {
    if (project.healthScore < 50) {
      const org = await prisma.organization.findFirst({
        where: { id: project.orgId },
        select: { id: true, name: true, users: { where: { role: "ORG_ADMIN" }, select: { email: true, name: true } } },
      });

      if (org?.users) {
        for (const admin of org.users) {
          await emailQueue.add("send-email", {
            to: admin.email,
            subject: `Project Health Alert: ${project.name}`,
            html: `<p>Project <strong>${project.name}</strong> health score is <strong>${project.healthScore}%</strong>. Please review.</p>`,
            orgId: project.orgId,
          });
        }
      }
    }
  }
}

async function handleWeeklyDigest(): Promise<void> {
  console.log("[Schedule] Sending weekly digests...");
  // Real implementation lives in analytics.worker.ts (Phase 11).
  // This stub is kept for backward compat — schedule service still
  // enqueues the job, and BullMQ delivers to whichever worker
  // accepts the name first.
}

async function handleEventCleanup(retentionDays?: number): Promise<void> {
  const days = retentionDays ?? 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const deleted = await prisma.event.deleteMany({
    where: {
      occurredAt: { lt: cutoffDate },
    },
  });

  console.log(`[Schedule] Deleted ${deleted.count} old events`);
}

scheduleWorker.on("completed", (job) => {
  console.log(`[Schedule] Job ${job.id} (${job.name}) completed`);
});

scheduleWorker.on("failed", (job, err) => {
  console.error(`[Schedule] Job ${job?.id} failed:`, err.message);
});

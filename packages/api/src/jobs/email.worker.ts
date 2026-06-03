/**
 * Phase 10 — Email queue worker.
 *
 * Processes email sending jobs from email-queue with retry logic
 * and event logging.
 */
import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { sendEmail, notificationEmailTemplate } from "../modules/notifications/email.service.js";
import { prisma } from "../config/prisma.js";
import { logEvent } from "../modules/events/events.service.js";

export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { to, subject, html, orgId, notificationId } = job.data;

    try {
      const result = await sendEmail({ to, subject, html });

      if (notificationId) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            sentAt: new Date(),
            data: {
              messageId: result.messageId,
            },
          },
        });
      }

      await logEvent({
        orgId,
        type: "notification.sent",
        aggregateId: notificationId ?? "unknown",
        aggregateType: "notification",
        payload: { to, subject },
        actorId: "system",
        actorType: "SYSTEM" as any,
      });

      return { success: true, messageId: result.messageId };
    } catch (err: unknown) {
      throw err;
    }
  },
  {
    connection: bullRedisClient,
    concurrency: env.WORKER_EMAIL_CONCURRENCY,
  },
);

emailWorker.on("completed", (job) => {
  console.log(`[Email] Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Email] Job ${job?.id} failed:`, err.message);
  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    console.error(
      `[Email] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`,
    );
  }
});

emailWorker.on("stalled", (jobId) => {
  console.warn(`[Email] Job ${jobId} stalled`);
});

/**
 * Phase 10 — Notification queue worker.
 *
 * Processes in-app notification delivery jobs from notification-queue.
 * Currently notifications are created synchronously in the notification
 * service, but this worker provides a future async path for batch
 * notification delivery and retry.
 */
import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { logEvent } from "../modules/events/events.service.js";

export const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {
    const { userId, orgId, type, title, body, data } = job.data;

    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          orgId,
          type,
          title,
          body,
          data: (data ?? {}) as any,
        },
      });

      await logEvent({
        orgId,
        type: "notification.sent",
        aggregateId: notification.id,
        aggregateType: "notification",
        payload: { to: userId, title },
        actorId: "system",
        actorType: "SYSTEM" as any,
      });

      return { success: true, notificationId: notification.id };
    } catch (err: unknown) {
      throw err;
    }
  },
  {
    connection: bullRedisClient,
    concurrency: 5,
  },
);

notificationWorker.on("completed", (job) => {
  console.log(`[Notification] Job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[Notification] Job ${job?.id} failed:`, err.message);
});

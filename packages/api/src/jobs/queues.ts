import { Queue } from "bullmq";
import { bullRedisClient } from "../config/redis.js";

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export const emailQueue = new Queue("email-queue", {
  connection: bullRedisClient,
  defaultJobOptions,
});

export const aiQueue = new Queue("ai-queue", {
  connection: bullRedisClient,
  defaultJobOptions,
});

export const webhookQueue = new Queue("webhook-queue", {
  connection: bullRedisClient,
  defaultJobOptions,
});

export const pdfQueue = new Queue("pdf-queue", {
  connection: bullRedisClient,
  defaultJobOptions,
});

export const graphSyncQueue = new Queue("graph-sync-queue", {
  connection: bullRedisClient,
  defaultJobOptions,
});

export const notificationQueue = new Queue("notification-queue", {
  connection: bullRedisClient,
  defaultJobOptions,
});

export const billingQueue = new Queue("billing-queue", {
  connection: bullRedisClient,
  defaultJobOptions,
});

export const sessionCleanupQueue = new Queue("session-cleanup-queue", {
  connection: bullRedisClient,
  defaultJobOptions,
});

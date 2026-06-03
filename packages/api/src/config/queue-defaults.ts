/**
 * Phase 10 — Default queue options applied to all BullMQ queues.
 * Configurable via env vars for retry logic, backoff, and stall detection.
 */
import type { QueueOptions } from "bullmq";
import { bullRedisClient } from "./redis.js";
import { env } from "./env.js";

export const DEFAULT_QUEUE_OPTS: QueueOptions = {
  connection: bullRedisClient,
  defaultJobOptions: {
    attempts: env.QUEUE_DEFAULT_ATTEMPTS,
    backoff: {
      type: env.QUEUE_BACKOFF_TYPE,
      delay: env.QUEUE_BACKOFF_DELAY_MS,
    },
    removeOnComplete: {
      age: 3600, // Remove successful jobs after 1 hour
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
};

/**
 * Phase 10 — Webhook delivery worker.
 *
 * Delivers outbound webhooks with retry logic. 4xx errors are NOT retried,
 * 5xx and network errors ARE retried via BullMQ backoff.
 */
import { Worker } from "bullmq";
import axios from "axios";
import { bullRedisClient } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { logEvent } from "../modules/events/events.service.js";

export const webhookWorker = new Worker(
  "webhook-queue",
  async (job) => {
    const { webhookId, orgId, url, payload, signature, timestamp } = job.data;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Sentient-Timestamp": timestamp,
    };

    if (signature) {
      headers["X-Sentient-Signature"] = signature;
    }

    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout: 10000,
        validateStatus: (status: number) => status < 500, // Retry on 5xx, not 4xx
      });

      // Record delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          orgId,
          status: "delivered",
          statusCode: response.status,
          response: (response.data ?? {}) as any,
        },
      });

      return { success: true, statusCode: response.status };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      // 4xx — don't retry, record failure
      if (axios.isAxiosError(err) && err.response?.status && err.response.status >= 400 && err.response.status < 500) {
        const statusCode = err.response.status;
        const respData = err.response.data as any;
        await prisma.webhookDelivery.create({
          data: {
            webhookId,
            orgId,
            status: "failed",
            statusCode,
            response: respData ?? {},
            lastError: message,
          },
        });

        // Don't retry — throw to stop further attempts
        throw new Error(`Webhook 4xx error (not retried): ${message}`);
      }

      // Network error or 5xx — let BullMQ retry
      throw new Error(`Failed to deliver webhook: ${message}`);
    }
  },
  {
    connection: bullRedisClient,
    concurrency: 2,
  },
);

webhookWorker.on("completed", (job) => {
  console.log(`[Webhook] Job ${job.id} delivered`);
});

webhookWorker.on("failed", async (job, err) => {
  console.error(`[Webhook] Job ${job?.id} failed:`, err.message);

  // Move to DLQ after max attempts
  if (job && job.attemptsMade >= (job.opts.attempts ?? 5)) {
    const { moveJobToDLQ } = await import("../modules/queue/dead-letter.service.js");
    await moveJobToDLQ("webhook-queue", job.id!, err);
  }
});

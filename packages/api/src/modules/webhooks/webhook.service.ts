/**
 * Phase 10 — Webhook delivery service.
 *
 * Enqueues outbound webhooks with HMAC signature verification.
 */
import { createHmac } from "node:crypto";
import { webhookQueue } from "../../config/queues.js";

export async function deliverWebhook(params: {
  webhookId: string;
  orgId: string;
  event: Record<string, unknown>;
  url: string;
  secret?: string;
}): Promise<void> {
  const payload = JSON.stringify(params.event);
  const timestamp = Date.now().toString();
  const signature = params.secret
    ? createHmacSignature(payload, params.secret, timestamp)
    : undefined;

  await webhookQueue.add("deliver-webhook", {
    webhookId: params.webhookId,
    orgId: params.orgId,
    url: params.url,
    payload,
    signature,
    timestamp,
  }, {
    attempts: 5,
    backoff: {
      type: "exponential" as const,
      delay: 5000,
    },
    priority: 3,
  });
}

export function createHmacSignature(
  payload: string,
  secret: string,
  timestamp: string,
): string {
  const message = `${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(message).digest("hex");
}

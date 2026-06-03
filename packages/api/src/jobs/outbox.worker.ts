import { OutboxStatus, type EventOutbox } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { redisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { emitToOrg } from "../websocket/events.js";
import { runProjectors } from "../modules/events/projectors/index.js";
import { processTriggers } from "../modules/agents/triggers/trigger.processor.js";
import type { OutboxEventEnvelope } from "../modules/events/events.service.js";

/**
 * Outbox poller (Phase 7 §4).
 *
 * Every N ms we scan `event_outbox` for `pending` entries whose
 * `next_retry_at <= now()` and deliver them:
 *
 *   1. XADD into the Reality Stream (Redis Stream)
 *   2. Emit `stream:event` to the org's Socket.io room
 *   3. Run the CQRS projectors (read models + notifications)
 *   4. Mark the outbox row as `delivered`
 *
 * Failures retry with exponential backoff (5s, 15s, 45s, 135s, 405s)
 * up to `OUTBOX_MAX_RETRIES` attempts. After that, the row moves to
 * `event_dead_letters` for manual inspection / retry.
 *
 * A Redis SETNX lock prevents two server instances from processing
 * the same outbox batch at the same time.
 */

const POLL_INTERVAL_MS = env.OUTBOX_POLL_INTERVAL_MS;
const BATCH_SIZE = env.OUTBOX_BATCH_SIZE;
const MAX_RETRIES = env.OUTBOX_MAX_RETRIES;
const STREAM_MAX_LEN = env.REDIS_STREAM_MAX_LEN;

// Exponential backoff in seconds: 5, 15, 45, 135, 405.
const RETRY_DELAYS = [5, 15, 45, 135, 405];

const LOCK_KEY = "outbox:poller:lock";
const LOCK_TTL_SECONDS = 30;

let intervalHandle: NodeJS.Timeout | null = null;
let running = false;

export function startOutboxPoller(): void {
  if (intervalHandle) return; // already started
  intervalHandle = setInterval(() => {
    if (running) return; // skip overlap if a batch is still in flight
    void processOutboxBatch();
  }, POLL_INTERVAL_MS);
  // Don't keep the event loop alive on shutdown.
  intervalHandle.unref?.();
  console.log(`[Outbox] Poller started — every ${POLL_INTERVAL_MS}ms, batch=${BATCH_SIZE}`);
}

export function stopOutboxPoller(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

/**
 * Drain pending outbox entries once. Used at startup smoke-test and at
 * graceful shutdown. Exported so `index.ts` can call it from
 * `gracefulShutdown`.
 */
export async function processOutboxBatch(): Promise<{
  processed: number;
  errors: number;
}> {
  // SETNX-based distributed lock so multiple processes don't double-process.
  const lockOk = await redisClient.set(LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
  if (!lockOk) return { processed: 0, errors: 0 };

  running = true;
  let processed = 0;
  let errors = 0;
  try {
    const entries = await prisma.eventOutbox.findMany({
      where: {
        status: OutboxStatus.pending,
        nextRetryAt: { lte: new Date() },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });
    if (entries.length === 0) return { processed, errors };

    const results = await Promise.allSettled(entries.map((entry) => deliverEntry(entry)));
    for (const r of results) {
      if (r.status === "fulfilled") processed++;
      else errors++;
    }
  } catch (err) {
    console.error("[Outbox] batch failed", err);
  } finally {
    running = false;
    await redisClient.del(LOCK_KEY).catch(() => undefined);
  }
  return { processed, errors };
}

async function deliverEntry(entry: EventOutbox): Promise<void> {
  const envelope = (entry.payload as { event?: OutboxEventEnvelope }).event;
  if (!envelope) {
    throw new Error(`[Outbox] entry ${entry.id} missing event payload`);
  }

  try {
    // 1. Emit to org room.
    emitToOrg(entry.orgId, "stream:event", envelope, {
      id: envelope.actorId,
      type: envelope.actorType,
    });

    // 2. Append to the Reality Stream (Redis Stream).
    await redisClient.xadd(
      env.REDIS_STREAM_KEY,
      "MAXLEN",
      "~",
      String(STREAM_MAX_LEN),
      "*",
      "orgId",
      entry.orgId,
      "eventId",
      envelope.id,
      "type",
      envelope.type,
      "aggregateId",
      envelope.aggregateId,
      "aggregateType",
      envelope.aggregateType,
    );

    // 3. Run CQRS projectors (each handles its own event-type filter).
    await runProjectors(envelope);

    // 3a. Phase 8 — wake up any matching AI agent triggers. Fire and
    //     forget so a slow agent can't block outbox delivery.
    void processTriggers(envelope).catch((err: unknown) => {
      console.error("[Outbox] processTriggers failed", err);
    });

    // 4. Mark as delivered.
    await prisma.eventOutbox.update({
      where: { id: entry.id },
      data: {
        status: OutboxStatus.delivered,
        deliveredAt: new Date(),
        attempts: entry.attempts + 1,
        lastError: null,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[Outbox] delivery failed for entry=${entry.id}`, error);
    await handleDeliveryFailure(entry, error);
    throw error;
  }
}

/**
 * Handle a delivery failure: schedule the next retry with exponential
 * backoff, or move to the dead-letter table when retries are exhausted.
 */
export async function handleDeliveryFailure(
  entry: EventOutbox,
  err: Error,
): Promise<void> {
  const newAttempts = entry.attempts + 1;
  if (newAttempts >= MAX_RETRIES) {
    await prisma.$transaction([
      prisma.eventOutbox.update({
        where: { id: entry.id },
        data: {
          status: OutboxStatus.dead_lettered,
          attempts: newAttempts,
          lastError: err.message,
        },
      }),
      prisma.eventDeadLetter.create({
        data: {
          eventId: entry.eventId,
          orgId: entry.orgId,
          eventType: entry.eventType,
          payload: entry.payload as any,
          error: err.message,
          attempts: newAttempts,
        },
      }),
    ]);
    return;
  }

  const delaySeconds = RETRY_DELAYS[Math.min(newAttempts - 1, RETRY_DELAYS.length - 1)]!;
  await prisma.eventOutbox.update({
    where: { id: entry.id },
    data: {
      attempts: newAttempts,
      lastError: err.message,
      nextRetryAt: new Date(Date.now() + delaySeconds * 1000),
    },
  });
}

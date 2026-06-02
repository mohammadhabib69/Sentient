import pLimit from "p-limit";
import { prisma } from "../../config/prisma.js";
import { redisClient } from "../../config/redis.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { runProjectors } from "./projectors/index.js";
import type { OutboxEventEnvelope } from "./events.service.js";

/**
 * Event replay engine (Phase 7 §6).
 *
 * Rebuilds any CQRS read model by replaying the event history. Useful
 * for:
 *   - Recovering from projector drift (wipe + replay)
 *   - Adding a new read model (replay history to populate it)
 *   - Auditing a specific aggregate
 *
 * Concurrency:
 *   - One replay per org at a time (Redis SETNX lock).
 *   - Up to 5 events processed concurrently inside a single replay
 *     (p-limit). Projectors are pure, so this is safe.
 *
 * The replay is idempotent: re-running it on a healthy read model
 * produces the same result.
 */

export interface ReplayOptions {
  orgId: string;
  aggregateType?: string;
  aggregateId?: string;
  fromVersion?: number;
  toVersion?: number;
  /** If true, walk the events but do NOT mutate read models. */
  dryRun?: boolean;
}

export interface ReplayResult {
  processed: number;
  errors: number;
  durationMs: number;
  dryRun: boolean;
}

export async function replayEvents(options: ReplayOptions): Promise<ReplayResult> {
  const {
    orgId,
    aggregateType,
    aggregateId,
    fromVersion = 0,
    toVersion,
    dryRun = false,
  } = options;

  const startedAt = Date.now();
  let processed = 0;
  let errors = 0;

  const lockKey = `replay:lock:${orgId}`;
  const lockTtl = env.READ_MODEL_REBUILD_LOCK_TTL;
  const locked = await redisClient.set(lockKey, "1", "EX", lockTtl, "NX");
  if (!locked) {
    throw new AppError(
      "A replay is already running for this organization",
      409,
      "REPLAY_IN_PROGRESS",
    );
  }

  const limit = pLimit(5);

  try {
    const batchSize = env.EVENT_REPLAY_BATCH_SIZE;
    let cursor: string | undefined = undefined;

    while (true) {
      const where: Record<string, unknown> = { orgId };
      if (aggregateType) where.aggregateType = aggregateType;
      if (aggregateId) where.aggregateId = aggregateId;
      if (fromVersion) where.version = { gte: fromVersion };
      if (toVersion) {
        where.version = { ...(where.version as object | undefined), lte: toVersion };
      }
      if (cursor) where.id = { gt: cursor };

      const events = await prisma.event.findMany({
        where,
        orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
        take: batchSize,
      });

      if (events.length === 0) break;

      if (dryRun) {
        processed += events.length;
      } else {
        const results = await Promise.allSettled(
          events.map((event) =>
            limit(() => {
              const envelope: OutboxEventEnvelope = {
                id: event.id,
                type: event.type,
                orgId: event.orgId,
                aggregateId: event.aggregateId,
                aggregateType: event.aggregateType,
                payload: (event.payload as Record<string, unknown>) ?? {},
                actorId: event.actorId,
                actorType: event.actorType,
                version: event.version,
                causationId: event.causationId,
                correlationId: event.correlationId,
                occurredAt: event.occurredAt.toISOString(),
              };
              return runProjectors(envelope);
            }),
          ),
        );
        for (const r of results) {
          if (r.status === "fulfilled") processed++;
          else {
            errors++;
            console.error("[replay] projector failed", r.reason);
          }
        }
      }

      cursor = events[events.length - 1]!.id;
      if (events.length < batchSize) break;
    }
  } finally {
    await redisClient.del(lockKey).catch(() => undefined);
  }

  return {
    processed,
    errors,
    durationMs: Date.now() - startedAt,
    dryRun,
  };
}

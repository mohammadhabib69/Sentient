import { z } from "zod";

/**
 * Query params for GET /v1/events.
 *
 * Phase 7 expanded filter set:
 *   - aggregateId / aggregateType
 *   - actorId / actorType
 *   - type (exact) | typePrefix (e.g. "task.")
 *   - from / to (ISO-8601, coerced to Date)
 *   - minVersion
 *   - cursor (id)
 *   - sortOrder asc | desc (default desc)
 *   - limit (default 50, max 200)
 */
export const listEventsQuerySchema = z.object({
  aggregateId: z.string().uuid().optional(),
  aggregateType: z.string().min(1).max(50).optional(),
  actorType: z.enum(["user", "agent", "system"]).optional(),
  actorId: z.string().uuid().optional(),
  type: z.string().min(1).max(100).optional(),
  typePrefix: z.string().min(1).max(50).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  minVersion: z.coerce.number().int().min(0).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().uuid().optional(),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

/**
 * Body schema for POST /v1/events/replay.
 */
export const replayEventsBodySchema = z.object({
  aggregateType: z.string().min(1).max(50).optional(),
  aggregateId: z.string().uuid().optional(),
  fromVersion: z.coerce.number().int().min(0).optional(),
  toVersion: z.coerce.number().int().min(0).optional(),
  dryRun: z.boolean().default(false),
});

export type ReplayEventsBody = z.infer<typeof replayEventsBodySchema>;

import { z } from "zod";

/**
 * Query params for GET /v1/events.
 *
 * `from`/`to` accept ISO-8601 strings. We coerce to Date in the service.
 */
export const listEventsQuerySchema = z.object({
  aggregateId: z.string().uuid().optional(),
  aggregateType: z.string().min(1).max(50).optional(),
  actorType: z.enum(["user", "agent", "system"]).optional(),
  type: z.string().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

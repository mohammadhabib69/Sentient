import type { ActorType } from "@sentient/shared";
import { z } from "zod";

export const eventEnvelopeSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  type: z.string().min(1),
  aggregateId: z.string().uuid(),
  aggregateType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  actorId: z.string().uuid(),
  actorType: z.enum(["user", "agent", "system"]),
  version: z.number().int().positive(),
  occurredAt: z.coerce.date(),
});

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema> & {
  actorType: ActorType;
};

import { z } from "zod";

export const taskVelocityQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const agentPerformanceQuerySchema = z.object({
  agentId: z.string().uuid().optional(),
  days: z.coerce.number().int().min(1).max(365).default(7),
});

export type TaskVelocityQuery = z.infer<typeof taskVelocityQuerySchema>;
export type AgentPerformanceQuery = z.infer<typeof agentPerformanceQuerySchema>;

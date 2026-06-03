/**
 * Zod schemas for the agent HTTP surface (Phase 8 §13).
 */
import { z } from "zod";

export const agentTypeSchema = z.enum([
  "operations",
  "finance",
  "customer",
  "dev",
  "custom",
]);

export const listMemoryQuerySchema = z.object({
  namespace: z.string().min(1).max(100).default("default"),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const clearMemoryQuerySchema = z.object({
  namespace: z.string().min(1).max(100).default("default"),
});

export const runAgentBodySchema = z.object({
  agentType: agentTypeSchema,
  prompt: z.string().min(1).max(8000),
});

export const supervisorBodySchema = z.object({
  prompt: z.string().min(1).max(8000),
});

export const updateConfigBodySchema = z.object({
  approvalMode: z.enum(["always", "auto_low_risk", "never"]).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const rejectActionBodySchema = z.object({
  reason: z.string().max(500).optional(),
});

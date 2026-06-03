/**
 * Zod schemas for custom agent builder request validation (Phase 9 §8).
 */
import { z } from "zod";

export const createCustomAgentBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  flowDefinition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
});

export const updateCustomAgentBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  flowDefinition: z
    .object({
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
    })
    .optional(),
  changeNote: z.string().max(500).optional(),
});

export const publishCustomAgentBodySchema = z.object({
  version: z.number().int().positive(),
});

export const testCustomAgentBodySchema = z.object({
  input: z.record(z.string(), z.any()).default({}),
  version: z.number().int().positive().optional(),
});

export const listCustomAgentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  cursor: z.string().optional(),
  filter: z.enum(["published", "draft", "all"]).default("all").optional(),
});

export const listExecutionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  cursor: z.string().optional(),
  status: z.string().optional(),
});

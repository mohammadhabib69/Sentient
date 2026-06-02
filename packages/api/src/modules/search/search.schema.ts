import { z } from "zod";

/**
 * Search module — Zod input schema (PRD §8).
 *
 * `types` is a comma-separated list of entity types to search. Defaults
 * to "task,project" when omitted.
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, "q must not be empty").max(200, "q must not exceed 200 characters"),
  types: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((t) => t.trim()).filter(Boolean) : ["task", "project"]))
    .pipe(z.array(z.enum(["task", "project", "workspace"]))),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

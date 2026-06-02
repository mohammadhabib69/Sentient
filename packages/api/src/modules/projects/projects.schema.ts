import { z } from "zod";

/**
 * Projects module — Zod input schemas (PRD §4).
 *
 * The Project model has a `status: ProjectStatus` enum and a
 * `priority: Priority` enum — both lowercase strings in Prisma's `@@map`
 * output, but TypeScript will surface them as the uppercase variant. We
 * accept the uppercase variant here (matches what the TS types expose)
 * and let Prisma store them in their @map form.
 */
export const projectStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
  "COMPLETED",
]);
export const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

/**
 * POST /v1/projects — create a new project.
 */
export const createProjectSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  status: projectStatusSchema.optional(),
  priority: prioritySchema.optional(),
  // ISO date string (YYYY-MM-DD). Coerce to Date on the way in.
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .optional()
    .transform((v) => (v ? new Date(v) : undefined))
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * PATCH /v1/projects/:id — partial update; at least one field required.
 */
export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .trim()
      .optional(),
    status: projectStatusSchema.optional(),
    priority: prioritySchema.optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
      .optional()
      .transform((v) => (v ? new Date(v) : undefined))
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.dueDate !== undefined ||
      data.metadata !== undefined,
    { message: "At least one field must be provided" },
  );

/**
 * GET /v1/projects — list with optional filters + cursor pagination.
 */
export const listProjectsQuerySchema = z.object({
  workspaceId: z.string().uuid().optional(),
  status: projectStatusSchema.optional(),
  priority: prioritySchema.optional(),
  search: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

/**
 * POST /v1/projects/:id/members — add a member.
 */
export const addProjectMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z
    .enum(["owner", "admin", "member", "viewer"])
    .default("member"),
});

/**
 * Common path params.
 */
export const projectIdParamSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
});
export const projectMemberParamSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  userId: z.string().uuid("Invalid user ID"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

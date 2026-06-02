import { z } from "zod";

/**
 * Workspaces module — Zod input schemas (PRD §3).
 *
 * All schemas are inferred as TS types and exported so the controller can
 * type its parsed inputs and the service can accept them safely.
 */

/**
 * POST /v1/workspaces — create a new workspace in the caller's org.
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

/**
 * PATCH /v1/workspaces/:id — partial update; at least one field is required.
 */
export const updateWorkspaceSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, "Description must not exceed 500 characters")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field must be provided",
  });

/**
 * GET /v1/workspaces — list with optional name search + cursor pagination.
 */
export const listWorkspacesQuerySchema = z.object({
  search: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

/**
 * POST /v1/workspaces/:id/members — add a user (in same org) to the workspace.
 *
 * NOTE (Phase 5): Workspaces don't yet have a dedicated membership table.
 * Adding a member is a no-op at the DB level — they are already an org user.
 * We still emit the `member.added` event so downstream consumers can react.
 */
export const addMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z
    .enum(["owner", "admin", "member", "viewer"])
    .default("member"),
});

/**
 * DELETE /v1/workspaces/:id/members/:userId — params shape.
 */
export const memberIdParamSchema = z.object({
  id: z.string().uuid("Invalid workspace ID"),
  userId: z.string().uuid("Invalid user ID"),
});

/**
 * Common path params.
 */
export const workspaceIdParamSchema = z.object({
  id: z.string().uuid("Invalid workspace ID"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type ListWorkspacesQuery = z.infer<typeof listWorkspacesQuerySchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;

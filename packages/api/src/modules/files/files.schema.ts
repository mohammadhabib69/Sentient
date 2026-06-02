import { z } from "zod";

/**
 * Files module — Zod schemas (PRD §6).
 *
 * Files are polymorphic: the `entityType` + `entityId` pair tells us
 * which parent owns the file. Phase 5 supports `task`, `project`,
 * `workspace`, and `profile`.
 */
export const entityTypeSchema = z.enum(["task", "project", "workspace", "profile"]);

/**
 * POST /v1/files (multipart form-data) — fields validated by multer +
 * the body schema below.
 */
export const uploadFileBodySchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid("Invalid entity ID"),
});

/**
 * GET /v1/entities/:type/:id/files
 */
export const entityFilesParamSchema = z.object({
  type: entityTypeSchema,
  id: z.string().uuid("Invalid entity ID"),
});

/**
 * GET /v1/files/:id
 */
export const fileIdParamSchema = z.object({
  id: z.string().uuid("Invalid file ID"),
});

export type EntityType = z.infer<typeof entityTypeSchema>;
export type UploadFileBody = z.infer<typeof uploadFileBodySchema>;

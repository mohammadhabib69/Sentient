import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { filesController, upload } from "./files.controller.js";

export const filesRouter = Router();

filesRouter.use(requireAuth);

/**
 * POST /v1/files (multipart/form-data) — upload a file.
 * Multer is applied at the route level so it runs before validation.
 */
filesRouter.post(
  "/",
  requirePermission("task:read"),
  upload.single("file"),
  filesController.upload.bind(filesController),
);

/**
 * GET /v1/files/:id — fetch a file + signed URL.
 */
filesRouter.get(
  "/:id",
  requirePermission("task:read"),
  filesController.get.bind(filesController),
);

/**
 * GET /v1/files/:id/url — signed download URL only.
 */
filesRouter.get(
  "/:id/url",
  requirePermission("task:read"),
  filesController.getDownloadUrl.bind(filesController),
);

/**
 * DELETE /v1/files/:id
 */
filesRouter.delete(
  "/:id",
  requirePermission("task:write"),
  filesController.delete.bind(filesController),
);

/**
 * GET /v1/entities/:type/:id/files
 */
filesRouter.get(
  "/entities/:type/:id/files",
  requirePermission("task:read"),
  filesController.listEntityFiles.bind(filesController),
);

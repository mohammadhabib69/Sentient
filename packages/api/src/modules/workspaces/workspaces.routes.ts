import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { workspacesController } from "./workspaces.controller.js";

export const workspacesRouter = Router();

// All workspace routes require an authenticated user.
workspacesRouter.use(requireAuth);

/**
 * GET /v1/workspaces — list org workspaces.
 * Permission: `workspace:read` (any member role has it).
 */
workspacesRouter.get(
  "/",
  requirePermission("workspace:read"),
  workspacesController.list.bind(workspacesController),
);

/**
 * POST /v1/workspaces — create a new workspace.
 * Permission: `workspace:create` (ORG_ADMIN / MANAGER roles).
 */
workspacesRouter.post(
  "/",
  requirePermission("workspace:create"),
  workspacesController.create.bind(workspacesController),
);

/**
 * GET /v1/workspaces/:id — fetch one workspace.
 */
workspacesRouter.get(
  "/:id",
  requirePermission("workspace:read"),
  workspacesController.get.bind(workspacesController),
);

/**
 * PATCH /v1/workspaces/:id — update name/description.
 * Permission: `workspace:read` is required to see; we additionally gate on
 * `members:invite` to keep edits within admin/manager roles. (PRD §3
 * doesn't specify an exact permission for the PATCH; using a write-flavored
 * permission keeps the surface consistent with Phase 6 RBAC changes.)
 */
workspacesRouter.patch(
  "/:id",
  requirePermission("workspace:create"),
  workspacesController.update.bind(workspacesController),
);

/**
 * DELETE /v1/workspaces/:id — soft delete.
 */
workspacesRouter.delete(
  "/:id",
  requirePermission("workspace:create"),
  workspacesController.softDelete.bind(workspacesController),
);

/**
 * GET /v1/workspaces/:id/members
 */
workspacesRouter.get(
  "/:id/members",
  requirePermission("workspace:read"),
  workspacesController.listMembers.bind(workspacesController),
);

/**
 * POST /v1/workspaces/:id/members
 * Permission: `members:invite`.
 */
workspacesRouter.post(
  "/:id/members",
  requirePermission("members:invite"),
  workspacesController.addMember.bind(workspacesController),
);

/**
 * DELETE /v1/workspaces/:id/members/:userId
 * Permission: `members:remove`.
 */
workspacesRouter.delete(
  "/:id/members/:userId",
  requirePermission("members:remove"),
  workspacesController.removeMember.bind(workspacesController),
);

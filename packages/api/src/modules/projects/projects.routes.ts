import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { projectsController } from "./projects.controller.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

/**
 * GET /v1/projects/:id/stats
 * MUST be registered before `GET /:id` so Express 5 matches the more
 * specific path first.
 */
projectsRouter.get(
  "/:id/stats",
  requirePermission("project:read"),
  projectsController.getStats.bind(projectsController),
);

/**
 * GET /v1/projects — list org projects.
 */
projectsRouter.get(
  "/",
  requirePermission("project:read"),
  projectsController.list.bind(projectsController),
);

/**
 * POST /v1/projects
 */
projectsRouter.post(
  "/",
  requirePermission("project:create"),
  projectsController.create.bind(projectsController),
);

/**
 * GET /v1/projects/:id
 */
projectsRouter.get(
  "/:id",
  requirePermission("project:read"),
  projectsController.get.bind(projectsController),
);

/**
 * PATCH /v1/projects/:id
 */
projectsRouter.patch(
  "/:id",
  requirePermission("project:write"),
  projectsController.update.bind(projectsController),
);

/**
 * DELETE /v1/projects/:id
 */
projectsRouter.delete(
  "/:id",
  requirePermission("project:write"),
  projectsController.softDelete.bind(projectsController),
);

/**
 * GET /v1/projects/:id/members
 */
projectsRouter.get(
  "/:id/members",
  requirePermission("project:read"),
  projectsController.listMembers.bind(projectsController),
);

/**
 * POST /v1/projects/:id/members
 */
projectsRouter.post(
  "/:id/members",
  requirePermission("members:invite"),
  projectsController.addMember.bind(projectsController),
);

/**
 * DELETE /v1/projects/:id/members/:userId
 */
projectsRouter.delete(
  "/:id/members/:userId",
  requirePermission("members:remove"),
  projectsController.removeMember.bind(projectsController),
);

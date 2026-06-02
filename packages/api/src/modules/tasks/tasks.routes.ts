import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { requireOwnerOrRole } from "../../middleware/abac.middleware.js";
import { tasksController } from "./tasks.controller.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

/**
 * GET /v1/tasks?projectId=...&...
 * Specific path: must come before `/:id` so Express 5 matches it first.
 */
tasksRouter.get(
  "/",
  requirePermission("task:read"),
  tasksController.list.bind(tasksController),
);

/**
 * POST /v1/tasks
 */
tasksRouter.post(
  "/",
  requirePermission("task:create"),
  tasksController.create.bind(tasksController),
);

/**
 * POST /v1/tasks/bulk-move
 * Must come before `/:id` routes.
 */
tasksRouter.post(
  "/bulk-move",
  requirePermission("task:write"),
  tasksController.bulkMove.bind(tasksController),
);

/**
 * GET /v1/tasks/:id
 */
tasksRouter.get(
  "/:id",
  requirePermission("task:read"),
  tasksController.get.bind(tasksController),
);

/**
 * PATCH /v1/tasks/:id
 * ABAC: members can edit their own assigned tasks; managers+ can edit any.
 */
const getTaskAssigneeId = async (req: any): Promise<string | null> => {
  const t = await prisma.task.findUnique({
    where: { id: req.params.id },
    select: { assigneeId: true },
  });
  return t?.assigneeId ?? null;
};

tasksRouter.patch(
  "/:id",
  requirePermission("task:write"),
  requireOwnerOrRole(getTaskAssigneeId, "MANAGER"),
  tasksController.update.bind(tasksController),
);

/**
 * DELETE /v1/tasks/:id
 */
tasksRouter.delete(
  "/:id",
  requirePermission("task:write"),
  requireOwnerOrRole(getTaskAssigneeId, "MANAGER"),
  tasksController.softDelete.bind(tasksController),
);

/**
 * POST /v1/tasks/:id/move
 */
tasksRouter.post(
  "/:id/move",
  requirePermission("task:write"),
  requireOwnerOrRole(getTaskAssigneeId, "MANAGER"),
  tasksController.move.bind(tasksController),
);

/**
 * GET /v1/tasks/:id/subtasks
 */
tasksRouter.get(
  "/:id/subtasks",
  requirePermission("task:read"),
  tasksController.listSubtasks.bind(tasksController),
);

/**
 * POST /v1/tasks/:id/comments
 */
tasksRouter.post(
  "/:id/comments",
  requirePermission("task:read"),
  tasksController.addComment.bind(tasksController),
);

/**
 * GET /v1/tasks/:id/comments
 */
tasksRouter.get(
  "/:id/comments",
  requirePermission("task:read"),
  tasksController.listComments.bind(tasksController),
);

/**
 * GET /v1/tasks/:id/events
 */
tasksRouter.get(
  "/:id/events",
  requirePermission("stream:read"),
  tasksController.getEvents.bind(tasksController),
);

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { analyticsController } from "./analytics.controller.js";

/**
 * Analytics routes (Phase 7).
 *
 * `analytics:read` is the only permission required — every role from
 * `MANAGER` upward has it, plus the project-level read accessors
 * handled inside the service.
 */
export const analyticsRouter = Router();

analyticsRouter.get(
  "/overview",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.overview.bind(analyticsController),
);

analyticsRouter.get(
  "/task-velocity",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.taskVelocity.bind(analyticsController),
);

analyticsRouter.get(
  "/agent-performance",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.agentPerformance.bind(analyticsController),
);

/**
 * Agent routes (Phase 8 §13).
 *
 * Permission model:
 *   - `agent:read` / authenticated — list + inspect agents
 *   - `agent:approve`              — approve / reject pending actions
 *   - `agent:manage`               — activate, deactivate, run, supervisor,
 *                                    memory read/clear, config update
 */
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { agentsController } from "./agents.controller.js";

export const agentsRouter = Router();

// Run / supervisor / pending — listed first so they don't get caught
// by the `:id` parameter routes below.
agentsRouter.post(
  "/run",
  requireAuth,
  requirePermission("agent:manage"),
  agentsController.run.bind(agentsController),
);

agentsRouter.post(
  "/supervisor",
  requireAuth,
  requirePermission("agent:manage"),
  agentsController.supervisor.bind(agentsController),
);

agentsRouter.get(
  "/actions/pending",
  requireAuth,
  requirePermission("agent:approve"),
  agentsController.listPending.bind(agentsController),
);

agentsRouter.post(
  "/actions/:id/approve",
  requireAuth,
  requirePermission("agent:approve"),
  agentsController.approve.bind(agentsController),
);

agentsRouter.post(
  "/actions/:id/reject",
  requireAuth,
  requirePermission("agent:approve"),
  agentsController.reject.bind(agentsController),
);

agentsRouter.get(
  "/actions/:id",
  requireAuth,
  requirePermission("agent:read"),
  agentsController.getAction.bind(agentsController),
);

// List / detail
agentsRouter.get(
  "/",
  requireAuth,
  requirePermission("agent:read"),
  agentsController.list.bind(agentsController),
);

agentsRouter.get(
  "/:id",
  requireAuth,
  requirePermission("agent:read"),
  agentsController.getOne.bind(agentsController),
);

agentsRouter.get(
  "/:id/actions",
  requireAuth,
  requirePermission("agent:read"),
  agentsController.listActions.bind(agentsController),
);

agentsRouter.post(
  "/:id/activate",
  requireAuth,
  requirePermission("agent:manage"),
  agentsController.activate.bind(agentsController),
);

agentsRouter.post(
  "/:id/deactivate",
  requireAuth,
  requirePermission("agent:manage"),
  agentsController.deactivate.bind(agentsController),
);

agentsRouter.patch(
  "/:id/config",
  requireAuth,
  requirePermission("agent:manage"),
  agentsController.updateConfig.bind(agentsController),
);

agentsRouter.get(
  "/:id/memory",
  requireAuth,
  requirePermission("agent:manage"),
  agentsController.listMemory.bind(agentsController),
);

agentsRouter.delete(
  "/:id/memory",
  requireAuth,
  requirePermission("agent:manage"),
  agentsController.clearMemory.bind(agentsController),
);

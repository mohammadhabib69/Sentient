/**
 * Custom agent builder routes (Phase 9 §8).
 *
 * Permission model:
 *   - `agent:read`   — list, get, versions, executions
 *   - `agent:manage` — create, update, delete, publish, test
 */
import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/rbac.middleware.js";
import { customAgentsController } from "./custom-agents.controller.js";

export const customAgentsRouter = Router();

// All routes require authentication
customAgentsRouter.use(requireAuth);

// POST /v1/agents/custom — create custom agent
customAgentsRouter.post(
  "/",
  requirePermission("agent:manage"),
  customAgentsController.create.bind(customAgentsController),
);

// GET /v1/agents/custom — list with pagination
customAgentsRouter.get(
  "/",
  requirePermission("agent:read"),
  customAgentsController.list.bind(customAgentsController),
);

// GET /v1/agents/custom/:id/versions — list versions
customAgentsRouter.get(
  "/:id/versions",
  requirePermission("agent:read"),
  customAgentsController.listVersions.bind(customAgentsController),
);

// GET /v1/agents/custom/:id/versions/:version — get specific version
customAgentsRouter.get(
  "/:id/versions/:version",
  requirePermission("agent:read"),
  customAgentsController.getVersion.bind(customAgentsController),
);

// POST /v1/agents/custom/:id/rollback/:version — rollback to version
customAgentsRouter.post(
  "/:id/rollback/:version",
  requirePermission("agent:manage"),
  customAgentsController.rollback.bind(customAgentsController),
);

// POST /v1/agents/custom/:id/clone — clone agent
customAgentsRouter.post(
  "/:id/clone",
  requirePermission("agent:manage"),
  customAgentsController.clone.bind(customAgentsController),
);

// POST /v1/agents/custom/:id/publish — publish version
customAgentsRouter.post(
  "/:id/publish",
  requirePermission("agent:manage"),
  customAgentsController.publish.bind(customAgentsController),
);

// POST /v1/agents/custom/:id/test — sandbox test
customAgentsRouter.post(
  "/:id/test",
  requirePermission("agent:manage"),
  customAgentsController.test.bind(customAgentsController),
);

// GET /v1/agents/custom/:id/executions — execution logs
customAgentsRouter.get(
  "/:id/executions",
  requirePermission("agent:read"),
  customAgentsController.listExecutions.bind(customAgentsController),
);

// GET /v1/agents/custom/:id — get one
customAgentsRouter.get(
  "/:id",
  requirePermission("agent:read"),
  customAgentsController.getOne.bind(customAgentsController),
);

// PATCH /v1/agents/custom/:id — update (creates new version)
customAgentsRouter.patch(
  "/:id",
  requirePermission("agent:manage"),
  customAgentsController.update.bind(customAgentsController),
);

// DELETE /v1/agents/custom/:id — delete
customAgentsRouter.delete(
  "/:id",
  requirePermission("agent:manage"),
  customAgentsController.delete.bind(customAgentsController),
);

// ─── Registry ──────────────────────────────────────────────────────

// GET /v1/agents/registry — browse all agents (built-in + custom)
export const registryRouter = Router();
registryRouter.use(requireAuth);
registryRouter.get(
  "/",
  requirePermission("agent:read"),
  customAgentsController.registry.bind(customAgentsController),
);

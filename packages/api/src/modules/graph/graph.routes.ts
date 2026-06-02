import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { graphController } from "./graph.controller.js";

export const graphRouter = Router();

graphRouter.use(requireAuth);

/**
 * GET /v1/graph — full org graph.
 * MUST come before `/:nodeId` so Express 5 matches the more specific path first.
 */
graphRouter.get(
  "/",
  requirePermission("stream:read"),
  graphController.getOrgGraph.bind(graphController),
);

/**
 * GET /v1/graph/bottlenecks
 */
graphRouter.get(
  "/bottlenecks",
  requirePermission("stream:read"),
  graphController.getBottlenecks.bind(graphController),
);

/**
 * GET /v1/graph/critical-path/:projectId
 */
graphRouter.get(
  "/critical-path/:projectId",
  requirePermission("stream:read"),
  graphController.getCriticalPath.bind(graphController),
);

/**
 * GET /v1/graph/neighbors/:nodeId
 */
graphRouter.get(
  "/neighbors/:nodeId",
  requirePermission("stream:read"),
  graphController.getNeighbors.bind(graphController),
);

/**
 * POST /v1/graph/rebuild — admin-only reconciliation.
 * Uses the same `stream:read` permission as a stand-in for "graph:admin"
 * (PRD doesn't list a dedicated permission; admins always have all
 * permissions per rbac.middleware).
 */
graphRouter.post(
  "/rebuild",
  requirePermission("stream:read"),
  graphController.rebuild.bind(graphController),
);

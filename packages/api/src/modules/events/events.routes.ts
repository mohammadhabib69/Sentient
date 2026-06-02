import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission, requireRole } from "../../middleware/rbac.middleware.js";
import { eventsController } from "./events.controller.js";

/**
 * Event routes (Phase 7).
 *
 * Permission model:
 *   - `stream:read`               — list events, reconstruct aggregate
 *   - `org_admin+` (ORG_ADMIN, MANAGER, SUPER_ADMIN) — DLQ listing + retry
 *   - `super_admin` only          — replay + outbox stats
 */
export const eventsRouter = Router();

eventsRouter.get(
  "/",
  requireAuth,
  requirePermission("stream:read"),
  eventsController.list.bind(eventsController),
);

eventsRouter.get(
  "/aggregate/:type/:id",
  requireAuth,
  requirePermission("stream:read"),
  eventsController.reconstruct.bind(eventsController),
);

eventsRouter.get(
  "/dead-letters",
  requireAuth,
  requireRole(UserRole.ORG_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  eventsController.listDeadLetters.bind(eventsController),
);

eventsRouter.post(
  "/dead-letters/:id/retry",
  requireAuth,
  requireRole(UserRole.ORG_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  eventsController.retryDeadLetter.bind(eventsController),
);

eventsRouter.get(
  "/outbox/stats",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  eventsController.outboxStats.bind(eventsController),
);

eventsRouter.post(
  "/replay",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  eventsController.replay.bind(eventsController),
);

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { eventsController } from "./events.controller.js";

export const eventsRouter = Router();

eventsRouter.get(
  "/",
  requireAuth,
  requirePermission("stream:read"),
  eventsController.list.bind(eventsController),
);

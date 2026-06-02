import { Router } from "express";
import { healthRouter } from "../../modules/health/health.routes.js";
import { authRouter } from "../../modules/auth/auth.routes.js";
import { eventsRouter } from "../../modules/events/events.routes.js";
import { workspacesRouter } from "../../modules/workspaces/workspaces.routes.js";
import { projectsRouter } from "../../modules/projects/projects.routes.js";
import { tasksRouter } from "../../modules/tasks/tasks.routes.js";
import { filesRouter } from "../../modules/files/files.routes.js";
import { graphRouter } from "../../modules/graph/graph.routes.js";
import { searchRouter } from "../../modules/search/search.routes.js";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/events", eventsRouter);
v1Router.use("/workspaces", workspacesRouter);
v1Router.use("/projects", projectsRouter);
v1Router.use("/tasks", tasksRouter);
v1Router.use("/files", filesRouter);
v1Router.use("/graph", graphRouter);
v1Router.use("/search", searchRouter);

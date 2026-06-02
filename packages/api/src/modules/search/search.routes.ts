import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { searchController } from "./search.controller.js";

export const searchRouter = Router();

/**
 * GET /v1/search?q=...&types=task,project
 *
 * The PRD doesn't list a permission gate for search, so we only
 * require authentication.
 */
searchRouter.get("/", requireAuth, searchController.search.bind(searchController));

// packages/api/src/modules/marketplace/marketplace.routes.ts
// Phase 3 stub — implementation in later phases

import { Router } from "express";
import { MarketplaceController } from "./marketplace.controller.js";

export const marketplaceRouter = Router();
const controller = new MarketplaceController();

marketplaceRouter.get("/plugins", controller.getPlugins.bind(controller));

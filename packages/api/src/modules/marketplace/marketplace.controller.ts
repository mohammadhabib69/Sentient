// packages/api/src/modules/marketplace/marketplace.controller.ts
// Phase 3 stub — implementation in later phases

import type { Request, Response } from "express";

export class MarketplaceController {
  async getPlugins(_req: Request, res: Response): Promise<void> {
    res.json({ plugins: [] });
  }
}

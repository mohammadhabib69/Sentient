import type { NextFunction, Request, Response } from "express";
import { searchService } from "./search.service.js";
import { searchQuerySchema } from "./search.schema.js";
import { ValidationError } from "../../utils/errors.js";

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const errors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const k = issue.path
            .filter((p): p is string | number => typeof p === "string" || typeof p === "number")
            .join(".") || "_";
          if (!errors[k]) errors[k] = [];
          errors[k].push(issue.message);
        }
        throw new ValidationError(errors);
      }
      const orgId = (req as any).orgId as string;
      const result = await searchService.search(orgId, parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

export const searchController = new SearchController();

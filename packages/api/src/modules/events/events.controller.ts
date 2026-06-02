import type { NextFunction, Request, Response } from "express";
import { eventsService } from "./events.service.js";
import { listEventsQuerySchema } from "./events.schema.js";
import { ValidationError } from "../../utils/errors.js";

/**
 * Events controller.
 *
 * Phase 5 only exposes GET /v1/events (the activity stream read endpoint).
 * Writes happen implicitly via `eventsService.logEvent` from CRUD services.
 */
export class EventsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = listEventsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const errors: Record<string, string[]> = {};
        parsed.error.issues.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        throw new ValidationError(errors);
      }

      const orgId = (req as any).orgId as string;
      const result = await eventsService.queryEvents({
        orgId,
        ...parsed.data,
        actorType: parsed.data.actorType
          ? (parsed.data.actorType.toUpperCase() as any)
          : undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          events: result.events,
          nextCursor: result.nextCursor,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const eventsController = new EventsController();

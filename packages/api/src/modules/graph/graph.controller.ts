import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { graphService } from "./graph.service.js";
import { ValidationError } from "../../utils/errors.js";

/**
 * Graph controller (PRD §9.4).
 */
const neighborsQuerySchema = z.object({
  depth: z.coerce.number().int().min(1).max(5).default(1),
});
const nodeIdParamSchema = z.object({
  nodeId: z.string().uuid("Invalid node ID"),
});
const projectIdParamSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

export class GraphController {
  async getOrgGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const result = await graphService.getOrgGraph(orgId);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getBottlenecks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const bottlenecks = await graphService.getBottlenecks(orgId);
      res.status(200).json({ success: true, data: { bottlenecks } });
    } catch (err) { next(err); }
  }

  async getCriticalPath(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = projectIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError({ projectId: ["Invalid project ID"] });
      }
      const path = await graphService.getCriticalPath(params.data.projectId);
      res.status(200).json({ success: true, data: { criticalPath: path } });
    } catch (err) { next(err); }
  }

  async getNeighbors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = nodeIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError({ nodeId: ["Invalid node ID"] });
      }
      const q = neighborsQuerySchema.safeParse(req.query);
      if (!q.success) {
        throw new ValidationError({ depth: ["depth must be 1-5"] });
      }
      const result = await graphService.getNeighbors(params.data.nodeId, q.data.depth);
      res.status(200).json({ success: true, data: { neighbors: result } });
    } catch (err) { next(err); }
  }

  async rebuild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const result = await graphService.rebuildOrgGraph(orgId);
      res.status(202).json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

export const graphController = new GraphController();

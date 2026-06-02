import type { NextFunction, Request, Response } from "express";
import { projectsService } from "./projects.service.js";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
  addProjectMemberSchema,
  projectIdParamSchema,
  projectMemberParamSchema,
} from "./projects.schema.js";
import { ValidationError } from "../../utils/errors.js";

/**
 * Projects controller (PRD §4 endpoints).
 *
 * Note on route order: `GET /:id/stats` is mounted separately in
 * `projects.routes.ts` and registered BEFORE `GET /:id` so Express 5
 * matches the more specific path first.
 */
export class ProjectsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = listProjectsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError(this.zodToFieldErrors(parsed.error));
      }
      const orgId = (req as any).orgId as string;
      const result = await projectsService.listProjects(orgId, parsed.data);
      res.status(200).json({
        success: true,
        data: {
          projects: result.items,
          nextCursor: result.meta.nextCursor,
          total: result.meta.total,
          hasMore: result.meta.hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(this.zodToFieldErrors(parsed.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const project = await projectsService.createProject(orgId, actorId, parsed.data);
      res.status(201).json({ success: true, data: { project } });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = projectIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError(this.zodToFieldErrors(params.error));
      }
      const orgId = (req as any).orgId as string;
      const project = await projectsService.getProject(orgId, params.data.id);
      res.status(200).json({ success: true, data: { project } });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = projectIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError(this.zodToFieldErrors(params.error));
      }
      const orgId = (req as any).orgId as string;
      const stats = await projectsService.getStats(orgId, params.data.id);
      res.status(200).json({ success: true, data: { stats } });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = projectIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError(this.zodToFieldErrors(params.error));
      }
      const body = updateProjectSchema.safeParse(req.body);
      if (!body.success) {
        throw new ValidationError(this.zodToFieldErrors(body.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const project = await projectsService.updateProject(
        orgId,
        actorId,
        params.data.id,
        body.data,
      );
      res.status(200).json({ success: true, data: { project } });
    } catch (error) {
      next(error);
    }
  }

  async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = projectIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError(this.zodToFieldErrors(params.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const result = await projectsService.softDeleteProject(orgId, actorId, params.data.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = projectIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError(this.zodToFieldErrors(params.error));
      }
      const orgId = (req as any).orgId as string;
      const members = await projectsService.listMembers(orgId, params.data.id);
      res.status(200).json({ success: true, data: { members } });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = projectIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError(this.zodToFieldErrors(params.error));
      }
      const body = addProjectMemberSchema.safeParse(req.body);
      if (!body.success) {
        throw new ValidationError(this.zodToFieldErrors(body.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const result = await projectsService.addMember(
        orgId,
        actorId,
        params.data.id,
        body.data,
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = projectMemberParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError(this.zodToFieldErrors(params.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const result = await projectsService.removeMember(
        orgId,
        actorId,
        params.data.id,
        params.data.userId,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  private zodToFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
    const out: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path
        .filter((p): p is string | number => typeof p === "string" || typeof p === "number")
        .join(".") || "_";
      if (!out[key]) out[key] = [];
      out[key].push(issue.message);
    }
    return out;
  }
}

export const projectsController = new ProjectsController();

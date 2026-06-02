import type { NextFunction, Request, Response } from "express";
import { workspacesService } from "./workspaces.service.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  listWorkspacesQuerySchema,
  addMemberSchema,
  memberIdParamSchema,
  workspaceIdParamSchema,
} from "./workspaces.schema.js";
import { toWorkspaceMemberResponse } from "./workspaces.types.js";
import { ValidationError } from "../../utils/errors.js";

/**
 * Workspaces controller (PRD §3 endpoints).
 *
 * Pattern: Zod safeParse → ValidationError → service call → JSON response.
 * Auth and org-scoping happen upstream: `req.orgId` is set by
 * `auth.middleware` and never read from the body.
 */
export class WorkspacesController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = listWorkspacesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError(this.zodToFieldErrors(parsed.error));
      }
      const orgId = (req as any).orgId as string;
      const result = await workspacesService.listWorkspaces(orgId, parsed.data);
      res.status(200).json({
        success: true,
        data: {
          workspaces: result.items,
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
      const parsed = createWorkspaceSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(this.zodToFieldErrors(parsed.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const ws = await workspacesService.createWorkspace(orgId, actorId, parsed.data);
      res.status(201).json({ success: true, data: { workspace: ws } });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParsed = workspaceIdParamSchema.safeParse(req.params);
      if (!idParsed.success) {
        throw new ValidationError(this.zodToFieldErrors(idParsed.error));
      }
      const orgId = (req as any).orgId as string;
      const ws = await workspacesService.getWorkspace(orgId, idParsed.data.id);
      res.status(200).json({ success: true, data: { workspace: ws } });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParsed = workspaceIdParamSchema.safeParse(req.params);
      if (!idParsed.success) {
        throw new ValidationError(this.zodToFieldErrors(idParsed.error));
      }
      const bodyParsed = updateWorkspaceSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new ValidationError(this.zodToFieldErrors(bodyParsed.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const ws = await workspacesService.updateWorkspace(
        orgId,
        actorId,
        idParsed.data.id,
        bodyParsed.data,
      );
      res.status(200).json({ success: true, data: { workspace: ws } });
    } catch (error) {
      next(error);
    }
  }

  async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParsed = workspaceIdParamSchema.safeParse(req.params);
      if (!idParsed.success) {
        throw new ValidationError(this.zodToFieldErrors(idParsed.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const result = await workspacesService.softDeleteWorkspace(
        orgId,
        actorId,
        idParsed.data.id,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParsed = workspaceIdParamSchema.safeParse(req.params);
      if (!idParsed.success) {
        throw new ValidationError(this.zodToFieldErrors(idParsed.error));
      }
      const orgId = (req as any).orgId as string;
      const members = await workspacesService.listMembers(orgId, idParsed.data.id);
      res.status(200).json({
        success: true,
        data: { members: members.map(toWorkspaceMemberResponse) },
      });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParsed = workspaceIdParamSchema.safeParse(req.params);
      if (!idParsed.success) {
        throw new ValidationError(this.zodToFieldErrors(idParsed.error));
      }
      const bodyParsed = addMemberSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new ValidationError(this.zodToFieldErrors(bodyParsed.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const result = await workspacesService.addMember(
        orgId,
        actorId,
        idParsed.data.id,
        bodyParsed.data,
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = memberIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError(this.zodToFieldErrors(params.error));
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const result = await workspacesService.removeMember(
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

  /**
   * Helper: turn a Zod failure into the {field: [messages]} map our
   * ValidationError expects.
   *
   * `issue.path` is typed as `PropertyKey[]` (which includes `symbol`) —
   * we filter to string/number segments so the result is JSON-safe.
   */
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

export const workspacesController = new WorkspacesController();

import type { NextFunction, Request, Response } from "express";
import { tasksService } from "./tasks.service.js";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  bulkPositionSchema,
  createCommentSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  taskCommentIdParamSchema,
} from "./tasks.schema.js";
import { ValidationError } from "../../utils/errors.js";

/**
 * Tasks controller (PRD §5 endpoints).
 */
export class TasksController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = listTasksQuerySchema.safeParse(req.query);
      if (!parsed.success) throw new ValidationError(this.zodToFieldErrors(parsed.error));
      const orgId = (req as any).orgId as string;
      const result = await tasksService.listTasks(orgId, parsed.data);
      res.status(200).json({
        success: true,
        data: {
          tasks: result.items,
          nextCursor: result.meta.nextCursor,
          total: result.meta.total,
          hasMore: result.meta.hasMore,
        },
      });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(this.zodToFieldErrors(parsed.error));
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const task = await tasksService.createTask(orgId, actorId, parsed.data);
      res.status(201).json({ success: true, data: { task } });
    } catch (error) { next(error); }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = taskIdParamSchema.safeParse(req.params);
      if (!params.success) throw new ValidationError(this.zodToFieldErrors(params.error));
      const orgId = (req as any).orgId as string;
      const task = await tasksService.getTask(orgId, params.data.id);
      res.status(200).json({ success: true, data: { task } });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = taskIdParamSchema.safeParse(req.params);
      if (!params.success) throw new ValidationError(this.zodToFieldErrors(params.error));
      const body = updateTaskSchema.safeParse(req.body);
      if (!body.success) throw new ValidationError(this.zodToFieldErrors(body.error));
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const actorRole = (req as any).user?.role as string;
      const task = await tasksService.updateTask(orgId, actorId, actorRole, params.data.id, body.data);
      res.status(200).json({ success: true, data: { task } });
    } catch (error) { next(error); }
  }

  async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = taskIdParamSchema.safeParse(req.params);
      if (!params.success) throw new ValidationError(this.zodToFieldErrors(params.error));
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const actorRole = (req as any).user?.role as string;
      const result = await tasksService.softDeleteTask(orgId, actorId, actorRole, params.data.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async move(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = taskIdParamSchema.safeParse(req.params);
      if (!params.success) throw new ValidationError(this.zodToFieldErrors(params.error));
      const body = moveTaskSchema.safeParse(req.body);
      if (!body.success) throw new ValidationError(this.zodToFieldErrors(body.error));
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const task = await tasksService.moveTask(orgId, actorId, params.data.id, body.data);
      res.status(200).json({ success: true, data: { task } });
    } catch (error) { next(error); }
  }

  async bulkMove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = bulkPositionSchema.safeParse(req.body);
      if (!body.success) throw new ValidationError(this.zodToFieldErrors(body.error));
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const result = await tasksService.bulkMoveTasks(orgId, actorId, body.data);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async listSubtasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = taskIdParamSchema.safeParse(req.params);
      if (!params.success) throw new ValidationError(this.zodToFieldErrors(params.error));
      const orgId = (req as any).orgId as string;
      const subtasks = await tasksService.listSubtasks(orgId, params.data.id);
      res.status(200).json({ success: true, data: { subtasks } });
    } catch (error) { next(error); }
  }

  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = taskIdParamSchema.safeParse(req.params);
      if (!params.success) throw new ValidationError(this.zodToFieldErrors(params.error));
      const body = createCommentSchema.safeParse(req.body);
      if (!body.success) throw new ValidationError(this.zodToFieldErrors(body.error));
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const comment = await tasksService.addComment(orgId, actorId, params.data.id, body.data);
      res.status(201).json({ success: true, data: { comment } });
    } catch (error) { next(error); }
  }

  async listComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = taskIdParamSchema.safeParse(req.params);
      if (!params.success) throw new ValidationError(this.zodToFieldErrors(params.error));
      const orgId = (req as any).orgId as string;
      const comments = await tasksService.listComments(orgId, params.data.id);
      res.status(200).json({ success: true, data: { comments } });
    } catch (error) { next(error); }
  }

  async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = taskIdParamSchema.safeParse(req.params);
      if (!params.success) throw new ValidationError(this.zodToFieldErrors(params.error));
      const orgId = (req as any).orgId as string;
      const result = await tasksService.getTaskEvents(orgId, params.data.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
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

export const tasksController = new TasksController();

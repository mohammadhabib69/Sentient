/**
 * Agents controller (Phase 8 §13).
 *
 * All routes are org-scoped via `req.orgId` (set by `authMiddleware`).
 * The controller is thin — every method validates the request, calls
 * the matching `agents.service.ts` function, and wraps the result in
 * the standard `{ success: true, data }` envelope.
 */
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { ValidationError } from "../../utils/errors.js";
import * as agentsService from "./agents.service.js";
import {
  clearMemoryQuerySchema,
  listMemoryQuerySchema,
  rejectActionBodySchema,
  runAgentBodySchema,
  supervisorBodySchema,
  updateConfigBodySchema,
} from "./agents.schema.js";

function parseOrThrow<T extends z.ZodType>(
  schema: T,
  value: unknown,
): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    });
    throw new ValidationError(errors);
  }
  return result.data;
}

function parseQuery<T extends z.ZodType>(
  schema: T,
  query: unknown,
): z.output<T> {
  return parseOrThrow(schema, query);
}

function parseBody<T extends z.ZodType>(
  schema: T,
  body: unknown,
): z.output<T> {
  return parseOrThrow(schema, body);
}

export class AgentsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const agents = await agentsService.listAgents(orgId);
      res.status(200).json({ success: true, data: { agents } });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const agent = await agentsService.getAgent(orgId, id);
      res.status(200).json({ success: true, data: { agent } });
    } catch (err) {
      next(err);
    }
  }

  async listActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const actions = await agentsService.listAgentActions(orgId, id);
      res.status(200).json({ success: true, data: { actions } });
    } catch (err) {
      next(err);
    }
  }

  async listPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const actions = await agentsService.listPendingActions(orgId);
      res.status(200).json({
        success: true,
        data: { actions, total: actions.length },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const action = await agentsService.getAction(orgId, id);
      res.status(200).json({ success: true, data: { action } });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const id = req.params.id as string;
      const result = await agentsService.approvePendingAction(orgId, id, userId);
      res.status(200).json({
        success: true,
        data: { action: { id, status: "executed", result } },
      });
    } catch (err) {
      next(err);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const id = req.params.id as string;
      const body = parseBody(rejectActionBodySchema, req.body ?? {});
      await agentsService.rejectPendingAction(orgId, id, userId, body.reason);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const body = parseBody(runAgentBodySchema, req.body ?? {});
      const result = await agentsService.enqueueAgentRun({
        orgId,
        agentType: body.agentType,
        prompt: body.prompt,
      });
      res.status(202).json({
        success: true,
        data: { ...result, message: "Agent job enqueued" },
      });
    } catch (err) {
      next(err);
    }
  }

  async supervisor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const body = parseBody(supervisorBodySchema, req.body ?? {});
      const result = await agentsService.runSupervisorRoute(orgId, body.prompt);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const agent = await agentsService.activateAgent(orgId, id);
      res.status(200).json({ success: true, data: { agent } });
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const agent = await agentsService.deactivateAgent(orgId, id);
      res.status(200).json({ success: true, data: { agent } });
    } catch (err) {
      next(err);
    }
  }

  async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const body = parseBody(updateConfigBodySchema, req.body ?? {});
      const agent = await agentsService.updateAgentConfig(orgId, id, body);
      res.status(200).json({ success: true, data: { agent } });
    } catch (err) {
      next(err);
    }
  }

  async listMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const query = parseQuery(listMemoryQuerySchema, req.query);
      const memories = await agentsService.listAgentMemory(
        orgId,
        id,
        query.namespace,
        query.limit,
      );
      res.status(200).json({ success: true, data: { memories } });
    } catch (err) {
      next(err);
    }
  }

  async clearMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const query = parseQuery(clearMemoryQuerySchema, req.query);
      const result = await agentsService.clearAgentMemory(
        orgId,
        id,
        query.namespace,
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const agentsController = new AgentsController();

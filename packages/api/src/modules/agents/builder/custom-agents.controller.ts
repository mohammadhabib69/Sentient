/**
 * Custom agent builder controller (Phase 9 §8).
 *
 * Thin controller — validates requests with Zod, delegates to the
 * custom agent service, wraps responses in the standard envelope.
 */
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { ValidationError } from "../../../utils/errors.js";
import * as customAgentsService from "./custom-agents.service.js";
import {
  createCustomAgentBodySchema,
  updateCustomAgentBodySchema,
  publishCustomAgentBodySchema,
  testCustomAgentBodySchema,
  listCustomAgentsQuerySchema,
  listExecutionsQuerySchema,
} from "./custom-agents.schema.js";

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

function parseBody<T extends z.ZodType>(
  schema: T,
  body: unknown,
): z.output<T> {
  return parseOrThrow(schema, body);
}

function parseQuery<T extends z.ZodType>(
  schema: T,
  query: unknown,
): z.output<T> {
  return parseOrThrow(schema, query);
}

export class CustomAgentsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const body = parseBody(createCustomAgentBodySchema, req.body ?? {});

      const agent = await customAgentsService.createCustomAgent({
        orgId,
        userId,
        name: body.name,
        description: body.description,
        flowDefinition: body.flowDefinition,
      });

      res.status(201).json({
        success: true,
        data: {
          id: agent.id,
          name: agent.name,
          version: agent.version,
          isPublished: agent.isPublished,
          createdAt: agent.createdAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const query = parseQuery(listCustomAgentsQuerySchema, req.query);

      const result = await customAgentsService.listCustomAgents(orgId, {
        limit: query.limit,
        cursor: query.cursor,
        filter: query.filter,
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const agent = await customAgentsService.getCustomAgent(orgId, id);
      res.status(200).json({ success: true, data: { agent } });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const id = req.params.id as string;
      const body = parseBody(updateCustomAgentBodySchema, req.body ?? {});

      const result = await customAgentsService.updateCustomAgent(
        orgId,
        id,
        userId,
        body,
      );

      res.status(200).json({
        success: true,
        data: { version: result.newVersion },
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      await customAgentsService.deleteCustomAgent(orgId, id);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async listVersions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const versions = await customAgentsService.listVersions(orgId, id);
      res.status(200).json({ success: true, data: { versions } });
    } catch (err) {
      next(err);
    }
  }

  async getVersion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const version = parseInt(req.params.version as string, 10);
      const ver = await customAgentsService.getVersion(orgId, id, version);
      res.status(200).json({ success: true, data: { version: ver } });
    } catch (err) {
      next(err);
    }
  }

  async rollback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const id = req.params.id as string;
      const version = parseInt(req.params.version as string, 10);

      const agent = await customAgentsService.rollbackToVersion(
        orgId,
        id,
        userId,
        version,
      );

      res.status(200).json({
        success: true,
        data: { id: agent.id, version: agent.version },
      });
    } catch (err) {
      next(err);
    }
  }

  async clone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const id = req.params.id as string;

      const agent = await customAgentsService.cloneCustomAgent(orgId, id, userId);

      res.status(201).json({
        success: true,
        data: {
          id: agent.id,
          name: agent.name,
          version: agent.version,
          isPublished: agent.isPublished,
          createdAt: agent.createdAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const id = req.params.id as string;
      const body = parseBody(publishCustomAgentBodySchema, req.body ?? {});

      const agent = await customAgentsService.publishCustomAgent(
        orgId,
        id,
        userId,
        body.version,
      );

      res.status(200).json({
        success: true,
        data: {
          id: agent.id,
          version: agent.version,
          publishedAt: agent.publishedAt?.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async test(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const id = req.params.id as string;
      const body = parseBody(testCustomAgentBodySchema, req.body ?? {});

      const result = await customAgentsService.testCustomAgent(orgId, id, userId, {
        input: body.input,
        version: body.version,
      });

      res.status(200).json({
        success: true,
        data: {
          executionId: result.executionId,
          success: result.success,
          output: result.output,
          durationMs: result.duration,
          error: result.error,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async listExecutions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const id = req.params.id as string;
      const query = parseQuery(listExecutionsQuerySchema, req.query);

      const result = await customAgentsService.listExecutions(orgId, id, {
        limit: query.limit,
        cursor: query.cursor,
        status: query.status,
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async registry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const filter = (req.query.filter as any) ?? "all";
      const search = (req.query.search as string) ?? undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await customAgentsService.getAgentRegistry(orgId, {
        filter,
        search,
        limit,
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const customAgentsController = new CustomAgentsController();

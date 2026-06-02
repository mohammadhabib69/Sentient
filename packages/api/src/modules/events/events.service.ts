import { randomUUID } from "node:crypto";
import { ActorType, type Event as PrismaEvent } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { redisClient } from "../../config/redis.js";
import { env } from "../../config/env.js";
import { emitToOrg } from "../../websocket/events.js";

/**
 * Event types emitted by the Phase 5 CRUD services.
 *
 * Kept as a string-literal union (not Prisma enum) so services across the
 * codebase can reference them as types without importing the events module.
 */
export const EventType = {
  WORKSPACE_CREATED: "workspace.created",
  WORKSPACE_UPDATED: "workspace.updated",
  WORKSPACE_DELETED: "workspace.deleted",
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  PROJECT_DELETED: "project.deleted",
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_DELETED: "task.deleted",
  TASK_STATUS_CHANGED: "task.status_changed",
  TASK_ASSIGNED: "task.assigned",
  TASK_MOVED: "task.moved",
  TASKS_BULK_MOVED: "tasks.bulk_moved",
  TASK_COMMENT_ADDED: "task.comment_added",
  FILE_UPLOADED: "file.uploaded",
  FILE_DELETED: "file.deleted",
  MEMBER_ADDED: "member.added",
  MEMBER_REMOVED: "member.removed",
} as const;

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

export interface LogEventParams {
  orgId: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  actorId: string;
  actorType: ActorType;
}

export interface QueryEventFilters {
  orgId: string;
  aggregateId?: string;
  aggregateType?: string;
  actorType?: ActorType;
  type?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  cursor?: string;
}

export class EventsService {
  /**
   * Append a new event for an aggregate.
   *
   * `version` is computed by scanning the prior max version for this
   * (aggregateType, aggregateId) pair. The composite PK `[id, occurredAt]`
   * is satisfied by passing an explicit `occurredAt` so tests can mock time
   * deterministically.
   */
  async logEvent(params: LogEventParams): Promise<PrismaEvent> {
    const id = randomUUID();
    const occurredAt = new Date();

    const last = await prisma.event.findFirst({
      where: {
        aggregateType: params.aggregateType,
        aggregateId: params.aggregateId,
      },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const version = (last?.version ?? 0) + 1;

    const event = await prisma.event.create({
      data: {
        id,
        orgId: params.orgId,
        type: params.type,
        aggregateId: params.aggregateId,
        aggregateType: params.aggregateType,
        payload: params.payload as any,
        actorId: params.actorId,
        actorType: params.actorType,
        version,
        occurredAt,
      },
    });

    // Phase 6 §10: mirror to Redis Stream and broadcast to org.
    // Both are best-effort — failures here must not block the caller
    // (the event is already durable in Postgres).
    void this.publishToStream(event, params).catch((err: unknown) => {
      console.error("[events] stream publish failed", err);
    });

    return event;
  }

  /**
   * XADD into the Reality Stream + emit `stream:event` to the org room.
   * Both are fire-and-forget at the call site.
   */
  private async publishToStream(
    event: PrismaEvent,
    params: LogEventParams,
  ): Promise<void> {
    // XADD sentient:events:stream MAXLEN ~ 10000 * orgId … eventId … type
    await redisClient.xadd(
      env.REDIS_STREAM_KEY,
      "MAXLEN",
      "~",
      String(env.REDIS_STREAM_MAX_LEN),
      "*",
      "orgId",
      event.orgId,
      "eventId",
      event.id,
      "type",
      event.type,
      "aggregateId",
      event.aggregateId,
      "aggregateType",
      event.aggregateType,
    );

    emitToOrg(params.orgId, "stream:event", {
      id: event.id,
      type: event.type,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      payload: event.payload,
      actor: {
        id: params.actorId,
        type: params.actorType,
      },
      occurredAt: event.occurredAt.toISOString(),
    });
  }

  /**
   * Read events for an org, newest first, with cursor pagination.
   *
   * Cursor is the event `id`; we order by `occurredAt DESC, id DESC` so the
   * composite PK tiebreaker is stable.
   */
  async queryEvents(filters: QueryEventFilters): Promise<{
    events: PrismaEvent[];
    nextCursor: string | null;
    total: number;
  }> {
    const limit = Math.max(1, Math.min(filters.limit ?? 20, 100));

    const where: Record<string, unknown> = { orgId: filters.orgId };
    if (filters.aggregateId) where.aggregateId = filters.aggregateId;
    if (filters.aggregateType) where.aggregateType = filters.aggregateType;
    if (filters.actorType) where.actorType = filters.actorType;
    if (filters.type) where.type = filters.type;
    if (filters.from || filters.to) {
      const occurredAt: Record<string, Date> = {};
      if (filters.from) occurredAt.gte = filters.from;
      if (filters.to) occurredAt.lte = filters.to;
      where.occurredAt = occurredAt;
    }

    const findArgs: any = {
      where,
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    };
    if (filters.cursor) {
      findArgs.cursor = { id: filters.cursor };
      findArgs.skip = 1;
    }

    const [rows, total] = await Promise.all([
      prisma.event.findMany(findArgs),
      prisma.event.count({ where }),
    ]);

    const hasMore = rows.length > limit;
    const events = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? events[events.length - 1]!.id : null;

    return { events, nextCursor, total };
  }
}

export const eventsService = new EventsService();

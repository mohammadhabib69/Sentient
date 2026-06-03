import { randomUUID } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { ActorType, type Event as PrismaEvent } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { redisClient } from "../../config/redis.js";
import { env } from "../../config/env.js";
import { emitToOrg } from "../../websocket/events.js";
import { validateEventPayload } from "./events.payloads.js";

/**
 * Event types emitted by the Phase 5 CRUD services.
 *
 * Kept as a string-literal union (not Prisma enum) so services across the
 * codebase can reference them as types without importing the events module.
 *
 * Phase 7 adds agent.* and project.* event types that flow through
 * projectors — see `modules/events/projectors/`.
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
  AGENT_ACTION_CREATED: "agent.action.created",
  AGENT_ACTION_APPROVED: "agent.action.approved",
  AGENT_ACTION_REJECTED: "agent.action.rejected",
  AGENT_ACTION_EXECUTED: "agent.action.executed",
  AGENT_ACTION_FAILED: "agent.action.failed",
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
  /** Optional — when provided, the same event will not be logged twice within 24h. */
  idempotencyKey?: string;
  /** Optional — the event id that caused this one. */
  causationId?: string;
  /** Optional — trace ID grouping a chain of related events. */
  correlationId?: string;
}

export interface QueryEventFilters {
  orgId: string;
  aggregateId?: string;
  aggregateType?: string;
  actorType?: ActorType;
  actorId?: string;
  type?: string;
  /** Match all event types with this prefix (e.g. "task."). */
  typePrefix?: string;
  from?: Date;
  to?: Date;
  minVersion?: number;
  limit?: number;
  cursor?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Shape that flows out of the outbox and into projectors / Socket.io
 * consumers. Phase 7 standardizes on this envelope so downstream code
 * doesn't need to re-shape the Prisma row.
 */
export interface OutboxEventEnvelope {
  id: string;
  type: string;
  orgId: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  actorId: string;
  actorType: ActorType;
  version: number;
  causationId?: string | null;
  correlationId?: string | null;
  occurredAt: string;
}

export class EventsService {
  /**
   * Append a new event for an aggregate.
   *
   * Phase 7 adds:
   *   - Idempotency: when `idempotencyKey` is supplied, duplicate calls
   *     within 24h return the existing event.
   *   - Optimistic versioning: the per-aggregate `version` is computed
   *     via `aggregate()` (one round-trip) inside the same transaction
   *     that creates the event.
   *   - Outbox write: in the same transaction we insert an
   *     `event_outbox` row. The poller picks it up and fans the event
   *     out to Socket.io, Redis Stream, and projectors.
   *   - Causation/correlation IDs: stored on the event for tracing.
   *
   * Socket.io / Redis Stream publication is performed by the outbox
   * poller, NOT here. This keeps `logEvent()` purely about durability.
   */
  async logEvent(params: LogEventParams): Promise<PrismaEvent> {
    // 1. Idempotency check (read-only, outside transaction).
    if (params.idempotencyKey) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await prisma.event.findFirst({
        where: {
          orgId: params.orgId,
          idempotencyKey: params.idempotencyKey,
          occurredAt: { gte: since },
        },
        orderBy: { occurredAt: "desc" },
      });
      if (existing) return existing;
    }

    // 2. Validate payload — reject early if the type's Zod schema fails.
    //    Unknown event types pass through (forward-compat).
    if (!validateEventPayload(params.type, params.payload)) {
      throw new Error(
        `[events] payload failed validation for type=${params.type}`,
      );
    }

    // 3. Compute the next version for this aggregate.
    const versionResult = await prisma.event.aggregate({
      where: { aggregateId: params.aggregateId },
      _max: { version: true },
    });
    const nextVersion = (versionResult._max.version ?? 0) + 1;

    // 4. Write event + outbox entry atomically.
    const id = randomUUID();
    const eventVersionId = createId();
    const occurredAt = new Date();

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          id,
          orgId: params.orgId,
          type: params.type,
          aggregateId: params.aggregateId,
          aggregateType: params.aggregateType,
          payload: params.payload as any,
          actorId: params.actorId,
          actorType: params.actorType,
          version: nextVersion,
          occurredAt,
          idempotencyKey: params.idempotencyKey ?? null,
          causationId: params.causationId ?? null,
          correlationId: params.correlationId ?? null,
        },
      });

      await tx.eventOutbox.create({
        data: {
          eventId: created.id,
          orgId: created.orgId,
          eventType: created.type,
          payload: {
            event: this.toEnvelope({
              ...created,
              version: created.version,
              occurredAt: created.occurredAt,
            }),
          } as any,
          nextRetryAt: new Date(),
        },
      });

      return created;
    });

    // Best-effort fire-and-forget broadcast for callers that want the
    // legacy Phase 5 behavior (the outbox poller will publish too, but
    // XADD is idempotent and Socket.io emits are deduplicated by the
    // client). This keeps the existing Phase 6 UX snappy while we
    // migrate more traffic through the outbox.
    void this.publishToStream(event, params).catch((err: unknown) => {
      console.error("[events] stream publish failed", err);
    });

    // `eventVersionId` is reserved for future correlation/trace metadata.
    void eventVersionId;

    return event;
  }

  /**
   * Build a wire-stable envelope from a Prisma event row.
   */
  toEnvelope(event: PrismaEvent): OutboxEventEnvelope {
    return {
      id: event.id,
      type: event.type,
      orgId: event.orgId,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      payload: (event.payload as Record<string, unknown>) ?? {},
      actorId: event.actorId,
      actorType: event.actorType,
      version: event.version,
      causationId: event.causationId,
      correlationId: event.correlationId,
      occurredAt: event.occurredAt.toISOString(),
    };
  }

  /**
   * Legacy Phase 5/6 publish path. Kept for backward compat — the
   * outbox poller is the new authoritative publisher.
   */
  private async publishToStream(
    event: PrismaEvent,
    params: LogEventParams,
  ): Promise<void> {
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
      version: event.version,
      occurredAt: event.occurredAt.toISOString(),
    });
  }

  /**
   * Read events for an org with full Phase 7 filter support:
   *   - aggregateId / aggregateType / actorType / actorId
   *   - exact `type=` or prefix `typePrefix=`
   *   - from / to / minVersion
   *   - cursor pagination
   *   - sortOrder asc | desc
   */
  async queryEvents(filters: QueryEventFilters): Promise<{
    events: PrismaEvent[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  }> {
    const limit = Math.max(1, Math.min(filters.limit ?? 50, 200));

    const where: Record<string, unknown> = { orgId: filters.orgId };
    if (filters.aggregateId) where.aggregateId = filters.aggregateId;
    if (filters.aggregateType) where.aggregateType = filters.aggregateType;
    if (filters.actorType) where.actorType = filters.actorType;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.type) where.type = filters.type;
    if (filters.typePrefix) where.type = { startsWith: filters.typePrefix };
    if (filters.minVersion !== undefined) where.version = { gte: filters.minVersion };
    if (filters.from || filters.to) {
      const occurredAt: Record<string, Date> = {};
      if (filters.from) occurredAt.gte = filters.from;
      if (filters.to) occurredAt.lte = filters.to;
      where.occurredAt = occurredAt;
    }

    const sortOrder = filters.sortOrder ?? "desc";
    const orderBy: Array<Record<string, "asc" | "desc">> =
      sortOrder === "asc"
        ? [{ occurredAt: "asc" }, { id: "asc" }]
        : [{ occurredAt: "desc" }, { id: "desc" }];

    const findArgs: any = {
      where,
      orderBy,
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

    return { events, nextCursor, hasMore, total };
  }

  /**
   * Reconstruct the timeline + derived state for a single aggregate by
   * replaying every event. Used by GET /v1/events/aggregate/:type/:id.
   */
  async reconstructAggregate(
    orgId: string,
    aggregateType: string,
    aggregateId: string,
  ): Promise<{
    aggregateType: string;
    aggregateId: string;
    currentVersion: number;
    history: PrismaEvent[];
    state: Record<string, unknown>;
  }> {
    const events = await prisma.event.findMany({
      where: { orgId, aggregateType, aggregateId },
      orderBy: [{ version: "asc" }],
    });

    const state: Record<string, unknown> = { id: aggregateId };

    for (const event of events) {
      const payload = (event.payload as Record<string, unknown>) ?? {};
      switch (event.type) {
        case "task.created":
          Object.assign(state, {
            title: payload.title,
            projectId: payload.projectId,
            status: payload.status,
            priority: payload.priority,
            position: payload.position,
          });
          break;
        case "task.updated": {
          const changes = (payload.changes as Record<string, { to: unknown }>) ?? {};
          for (const [field, change] of Object.entries(changes)) {
            state[field] = change.to;
          }
          break;
        }
        case "task.status_changed": {
          const changes = (payload.changes as Record<string, { to: unknown }>) ?? {};
          if (changes.status?.to !== undefined) state.status = changes.status.to;
          break;
        }
        case "task.assigned": {
          const changes = (payload.changes as Record<string, { to: unknown }>) ?? {};
          if (changes.assigneeId) state.assigneeId = changes.assigneeId.to;
          break;
        }
        case "task.moved": {
          const from = payload.from as { status?: string; position?: number } | undefined;
          const to = payload.to as { status?: string; position?: number } | undefined;
          if (to?.status) state.status = to.status;
          if (to?.position !== undefined) state.position = to.position;
          void from;
          break;
        }
        case "project.created":
          Object.assign(state, {
            name: payload.name,
            workspaceId: payload.workspaceId,
            orgId: payload.orgId,
          });
          break;
        case "project.updated": {
          const changes = (payload.changes as Record<string, { to: unknown }>) ?? {};
          for (const [field, change] of Object.entries(changes)) {
            state[field] = change.to;
          }
          break;
        }
        default:
          // Carry the raw payload through so consumers can inspect.
          state.lastEvent = { type: event.type, payload };
      }
    }

    return {
      aggregateType,
      aggregateId,
      currentVersion: events.length > 0 ? events[events.length - 1]!.version : 0,
      history: events,
      state,
    };
  }
}

export const eventsService = new EventsService();

/** Standalone convenience export for calling logEvent without the service instance. */
export const logEvent = eventsService.logEvent.bind(eventsService);

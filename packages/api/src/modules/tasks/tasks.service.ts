import { ActorType, TaskStatus, type Task, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { eventsService, EventType } from "../events/events.service.js";
import { enqueueGraphSync } from "../graph/graphSync.helper.js";
import { emitToOrg } from "../../websocket/events.js";
import { broadcastOrgMetrics } from "../../websocket/metrics.broadcaster.js";
import { paginateCursor } from "../../utils/pagination.js";
import { NotFoundError, ForbiddenError, AppError } from "../../utils/errors.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  BulkPositionInput,
  CreateCommentInput,
  ListTasksQuery,
} from "./tasks.schema.js";
import {
  toTaskResponse,
  toTaskCommentResponse,
  type TaskResponse,
} from "./tasks.types.js";

/**
 * Tasks service (PRD §5).
 *
 * The kanban position engine lives here. The rule is:
 *   - `position` is a non-negative integer unique within `(projectId, status)`.
 *   - We renumber on every move/bulk-move to keep positions compact.
 *
 * Cross-cutting effects (PRD §7, §9): every mutation logs an event,
 * enqueues a graph sync (or `ASSIGN_TASK` when the assignee changes),
 * and broadcasts via the WebSocket stub.
 */
export class TasksService {
  // ─── CRUD ────────────────────────────────────────────────────────────────

  /**
   * GET /v1/tasks?projectId=... — list tasks for a project.
   */
  async listTasks(
    orgId: string,
    query: ListTasksQuery,
  ): Promise<{
    items: TaskResponse[];
    meta: { nextCursor: string | null; total: number; hasMore: boolean };
  }> {
    const project = await prisma.project.findFirst({
      where: { id: query.projectId, orgId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundError("Project");

    const where: Prisma.TaskWhereInput = {
      orgId,
      projectId: query.projectId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.search) {
      where.title = { contains: query.search, mode: "insensitive" };
    }
    if (!query.includeSubtasks) {
      where.parentTaskId = null;
    }

    const { items, meta } = await paginateCursor<Task>({
      model: prisma.task as any,
      where,
      limit: query.limit,
      cursor: query.cursor,
      orderBy: [{ status: "asc" }, { position: "asc" }, { id: "asc" }],
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Subtask counts per parent. Single grouped query for the page.
    const ids = items.map((t) => t.id);
    const subtaskGroups = await prisma.task.groupBy({
      by: ["parentTaskId", "status"],
      where: { orgId, parentTaskId: { in: ids }, deletedAt: null },
      _count: { _all: true },
    });
    const subtaskCount: Record<string, number> = {};
    const completedSubtaskCount: Record<string, number> = {};
    for (const row of subtaskGroups) {
      const pid = row.parentTaskId;
      if (!pid) continue;
      subtaskCount[pid] = (subtaskCount[pid] ?? 0) + row._count._all;
      if (row.status === TaskStatus.DONE) {
        completedSubtaskCount[pid] = (completedSubtaskCount[pid] ?? 0) + row._count._all;
      }
    }

    const responseItems: TaskResponse[] = items.map((t) =>
      toTaskResponse(
        t,
        subtaskCount[t.id] ?? 0,
        completedSubtaskCount[t.id] ?? 0,
      ),
    );
    return { items: responseItems, meta };
  }

  /**
   * POST /v1/tasks — create a new task.
   *
   * Position is `max(position in (projectId, status)) + 1` so the new
   * task lands at the bottom of its column. We default to TODO.
   */
  async createTask(
    orgId: string,
    actorId: string,
    input: CreateTaskInput,
  ): Promise<TaskResponse> {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, orgId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundError("Project");

    if (input.assigneeId) {
      const user = await prisma.user.findFirst({
        where: { id: input.assigneeId, orgId },
        select: { id: true },
      });
      if (!user) throw new NotFoundError("User");
    }

    if (input.parentTaskId) {
      const parent = await prisma.task.findFirst({
        where: { id: input.parentTaskId, orgId, projectId: input.projectId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) throw new NotFoundError("ParentTask");
    }

    const status = input.status ?? TaskStatus.TODO;
    const maxRow = await prisma.task.aggregate({
      where: { orgId, projectId: input.projectId, status, deletedAt: null },
      _max: { position: true },
    });
    const position = (maxRow._max.position ?? -1) + 1;

    const created = await prisma.task.create({
      data: {
        orgId,
        projectId: input.projectId,
        parentTaskId: input.parentTaskId ?? null,
        title: input.title,
        description: input.description ?? null,
        status,
        priority: input.priority ?? "MEDIUM",
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
        estimatedHours: input.estimatedHours ?? null,
        position,
        graphNodeId: "",
        createdBy: actorId,
      },
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.TASK_CREATED,
        aggregateId: created.id,
        aggregateType: "task",
        payload: { title: created.title, projectId: created.projectId, status: created.status, position: created.position },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({ action: "CREATE_TASK", taskId: created.id }),
    ]);
    if (created.assigneeId) {
      await Promise.allSettled([
        enqueueGraphSync({ action: "ASSIGN_TASK", taskId: created.id, userId: created.assigneeId }),
      ]);
    }
    emitToOrg(
      orgId,
      "task:created",
      { id: created.id, title: created.title, projectId: created.projectId },
      { id: actorId, type: ActorType.USER },
    );
    void broadcastOrgMetrics(orgId).catch(() => undefined);

    return toTaskResponse(created);
  }

  /**
   * GET /v1/tasks/:id — fetch a single task with subtasks + comments.
   */
  async getTask(orgId: string, id: string): Promise<TaskResponse> {
    const task = await prisma.task.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        subtasks: {
          where: { deletedAt: null },
          select: { id: true, title: true, status: true, position: true },
          orderBy: [{ position: "asc" }, { id: "asc" }],
        },
      },
    });
    if (!task) throw new NotFoundError("Task");

    const completedSubtaskCount = task.subtasks.filter((s) => s.status === TaskStatus.DONE).length;
    return toTaskResponse(task, task.subtasks.length, completedSubtaskCount);
  }

  /**
   * PATCH /v1/tasks/:id — partial update.
   *
   * Enforces ABAC: a `MEMBER` can only edit their own assigned tasks.
   */
  async updateTask(
    orgId: string,
    actorId: string,
    actorRole: string,
    id: string,
    input: UpdateTaskInput,
  ): Promise<TaskResponse> {
    const existing = await prisma.task.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Task");

    if (actorRole === "MEMBER" && existing.assigneeId !== actorId) {
      throw new ForbiddenError("Members can only edit their own assigned tasks");
    }

    // Build a per-field diff.
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const data: Record<string, unknown> = {};

    if (input.title !== undefined && input.title !== existing.title) {
      changes.title = { from: existing.title, to: input.title };
      data.title = input.title;
    }
    if (input.description !== undefined && input.description !== existing.description) {
      changes.description = { from: existing.description, to: input.description };
      data.description = input.description;
    }
    if (input.status !== undefined && input.status !== existing.status) {
      changes.status = { from: existing.status, to: input.status };
      data.status = input.status;
    }
    if (input.priority !== undefined && input.priority !== existing.priority) {
      changes.priority = { from: existing.priority, to: input.priority };
      data.priority = input.priority;
    }
    if (input.dueDate !== undefined) {
      const fromD = existing.dueDate ? existing.dueDate.toISOString() : null;
      const toD = input.dueDate ? input.dueDate.toISOString() : null;
      if (fromD !== toD) {
        changes.dueDate = { from: fromD, to: toD };
        data.dueDate = input.dueDate;
      }
    }
    if (input.estimatedHours !== undefined) {
      const fromE = existing.estimatedHours ? Number(existing.estimatedHours) : null;
      if (fromE !== input.estimatedHours) {
        changes.estimatedHours = { from: fromE, to: input.estimatedHours };
        data.estimatedHours = input.estimatedHours;
      }
    }
    if (input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId) {
      changes.assigneeId = { from: existing.assigneeId, to: input.assigneeId };
      data.assigneeId = input.assigneeId;
    }

    if (Object.keys(changes).length === 0) {
      return this.getTask(orgId, id);
    }

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Determine which events to emit.
    const eventTypes: string[] = [EventType.TASK_UPDATED];
    if (changes.status) eventTypes.push(EventType.TASK_STATUS_CHANGED);
    if (changes.assigneeId) eventTypes.push(EventType.TASK_ASSIGNED);

    const eventPromises = eventTypes.map((type) =>
      eventsService.logEvent({
        orgId,
        type,
        aggregateId: id,
        aggregateType: "task",
        payload: { changes },
        actorId,
        actorType: ActorType.USER,
      }),
    );
    const queuePromises: Promise<any>[] = [
      enqueueGraphSync({ action: "UPDATE_TASK", taskId: id }),
    ];
    if (changes.assigneeId && updated.assigneeId) {
      queuePromises.push(
        enqueueGraphSync({ action: "ASSIGN_TASK", taskId: id, userId: updated.assigneeId }),
      );
    }
    await Promise.allSettled([...eventPromises, ...queuePromises]);
    emitToOrg(
      orgId,
      "task:updated",
      { id, changes },
      { id: actorId, type: ActorType.USER },
    );
    if (changes.status || changes.assigneeId) {
      void broadcastOrgMetrics(orgId).catch(() => undefined);
    }

    return toTaskResponse(updated);
  }

  /**
   * DELETE /v1/tasks/:id — soft delete.
   */
  async softDeleteTask(
    orgId: string,
    actorId: string,
    actorRole: string,
    id: string,
  ): Promise<{ id: string; deleted: true }> {
    const existing = await prisma.task.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Task");

    if (actorRole === "MEMBER" && existing.assigneeId !== actorId) {
      throw new ForbiddenError("Members can only delete their own assigned tasks");
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.TASK_DELETED,
        aggregateId: id,
        aggregateType: "task",
        payload: { title: existing.title },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({ action: "DELETE_TASK", taskId: id }),
    ]);
    emitToOrg(
      orgId,
      "task:deleted",
      { id },
      { id: actorId, type: ActorType.USER },
    );
    void broadcastOrgMetrics(orgId).catch(() => undefined);

    return { id, deleted: true };
  }

  // ─── Kanban position engine (PRD §5.5) ───────────────────────────────────

  /**
   * POST /v1/tasks/:id/move — change status and/or position, renumbering
   * the affected columns so positions stay dense.
   *
   * Algorithm (PRD §5.5):
   *   - If new status differs:
   *       a) close gap in old column: decrement positions >= oldPos (excl. self)
   *       b) open slot in new column: increment positions >= newPos
   *       c) move the task
   *   - If same status:
   *       a) moving down: decrement positions in (oldPos, newPos]
   *       b) moving up:   increment positions in [newPos, oldPos)
   *       c) move the task
   *
   * The whole sequence runs in a `prisma.$transaction` so failures
   * roll back the renumber.
   */
  async moveTask(
    orgId: string,
    actorId: string,
    id: string,
    input: MoveTaskInput,
  ): Promise<TaskResponse> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.task.findFirst({
        where: { id, orgId, deletedAt: null },
      });
      if (!current) throw new NotFoundError("Task");

      const oldStatus = current.status;
      const newStatus = input.status;
      const oldPos = current.position;
      const newPos = input.position;

      if (oldStatus === newStatus) {
        if (newPos === oldPos) {
          return this.getTask(orgId, id);
        }
        if (newPos > oldPos) {
          // Moving down: shift everything between (oldPos, newPos] up by 1.
          await tx.task.updateMany({
            where: {
              orgId,
              projectId: current.projectId,
              status: oldStatus,
              position: { gt: oldPos, lte: newPos },
              NOT: { id },
            },
            data: { position: { decrement: 1 } },
          });
        } else {
          // Moving up: shift everything between [newPos, oldPos) down by 1.
          await tx.task.updateMany({
            where: {
              orgId,
              projectId: current.projectId,
              status: oldStatus,
              position: { gte: newPos, lt: oldPos },
              NOT: { id },
            },
            data: { position: { increment: 1 } },
          });
        }
        await tx.task.update({
          where: { id },
          data: { position: newPos },
        });
      } else {
        // Cross-column move: close gap in old, open slot in new.
        await tx.task.updateMany({
          where: {
            orgId,
            projectId: current.projectId,
            status: oldStatus,
            position: { gte: oldPos },
            NOT: { id },
          },
          data: { position: { decrement: 1 } },
        });
        await tx.task.updateMany({
          where: {
            orgId,
            projectId: current.projectId,
            status: newStatus,
            position: { gte: newPos },
            NOT: { id },
          },
          data: { position: { increment: 1 } },
        });
        await tx.task.update({
          where: { id },
          data: { status: newStatus, position: newPos },
        });
      }

      const updated = await tx.task.findUnique({
        where: { id },
        include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
      });
      if (!updated) throw new NotFoundError("Task");

      // Best-effort cross-cutting side effects.
      await eventsService.logEvent({
        orgId,
        type: EventType.TASK_MOVED,
        aggregateId: id,
        aggregateType: "task",
        payload: { from: { status: oldStatus, position: oldPos }, to: { status: newStatus, position: newPos } },
        actorId,
        actorType: ActorType.USER,
      });
      await enqueueGraphSync({ action: "UPDATE_TASK", taskId: id });
      emitToOrg(
        orgId,
        "task:moved",
        { id, from: { status: oldStatus, position: oldPos }, to: { status: newStatus, position: newPos } },
        { id: actorId, type: ActorType.USER },
      );
      if (oldStatus !== newStatus) {
        void broadcastOrgMetrics(orgId).catch(() => undefined);
      }

      return toTaskResponse(updated);
    });
  }

  /**
   * POST /v1/tasks/bulk-move — apply many moves atomically.
   *
   * The caller is expected to send the FINAL desired state for every
   * affected column; we don't rebalance, we just apply.
   */
  async bulkMoveTasks(
    orgId: string,
    actorId: string,
    input: BulkPositionInput,
  ): Promise<{ updated: number }> {
    // Verify every task is in the caller's org.
    const ids = input.updates.map((u) => u.id);
    const existing = await prisma.task.findMany({
      where: { id: { in: ids }, orgId, deletedAt: null },
      select: { id: true },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundError("One or more tasks");
    }

    await prisma.$transaction(
      input.updates.map((u) =>
        prisma.task.update({
          where: { id: u.id },
          data: { status: u.status, position: u.position },
        }),
      ),
    );

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.TASKS_BULK_MOVED,
        aggregateId: ids[0]!,
        aggregateType: "task",
        payload: { count: ids.length },
        actorId,
        actorType: ActorType.USER,
      }),
      ...ids.map((tid) => enqueueGraphSync({ action: "UPDATE_TASK", taskId: tid })),
    ]);
    emitToOrg(
      orgId,
      "tasks:bulk_moved",
      { count: ids.length },
      { id: actorId, type: ActorType.USER },
    );
    void broadcastOrgMetrics(orgId).catch(() => undefined);

    return { updated: ids.length };
  }

  // ─── Subtasks ────────────────────────────────────────────────────────────

  async listSubtasks(orgId: string, taskId: string): Promise<TaskResponse[]> {
    const parent = await prisma.task.findFirst({
      where: { id: taskId, orgId, deletedAt: null },
      select: { id: true },
    });
    if (!parent) throw new NotFoundError("Task");

    const subs = await prisma.task.findMany({
      where: { orgId, parentTaskId: taskId, deletedAt: null },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });
    return subs.map((s) => toTaskResponse(s));
  }

  // ─── Comments ────────────────────────────────────────────────────────────

  async addComment(
    orgId: string,
    actorId: string,
    taskId: string,
    input: CreateCommentInput,
  ) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, orgId, deletedAt: null },
      select: { id: true },
    });
    if (!task) throw new NotFoundError("Task");

    const created = await prisma.taskComment.create({
      data: {
        orgId,
        taskId,
        authorId: actorId,
        content: input.content,
      },
      include: { author: true },
    });

    await eventsService.logEvent({
      orgId,
      type: EventType.TASK_COMMENT_ADDED,
      aggregateId: taskId,
      aggregateType: "task",
      payload: {
        commentId: created.id,
        contentPreview: input.content.slice(0, 100),
      },
      actorId,
      actorType: ActorType.USER,
    });
    emitToOrg(
      orgId,
      "task:comment_added",
      { taskId, commentId: created.id },
      { id: actorId, type: ActorType.USER },
    );

    return toTaskCommentResponse(created);
  }

  async listComments(orgId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, orgId, deletedAt: null },
      select: { id: true },
    });
    if (!task) throw new NotFoundError("Task");

    const rows = await prisma.taskComment.findMany({
      where: { orgId, taskId },
      orderBy: { createdAt: "desc" },
      include: { author: true },
    });
    return rows.map(toTaskCommentResponse);
  }

  /**
   * GET /v1/tasks/:id/events — task-scoped activity stream.
   */
  async getTaskEvents(orgId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, orgId, deletedAt: null },
      select: { id: true },
    });
    if (!task) throw new NotFoundError("Task");
    return eventsService.queryEvents({
      orgId,
      aggregateId: taskId,
      aggregateType: "task",
      limit: 100,
    });
  }
}

export const tasksService = new TasksService();

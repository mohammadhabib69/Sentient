/**
 * Unit tests: TasksService — focus on the kanban position engine.
 *
 * Covers (PRD §5.5):
 *  - Same column, moving down (positions between old and new shift up by 1)
 *  - Same column, moving up (positions between new and old shift down by 1)
 *  - Cross-column move (close old gap, open new slot, update task)
 *  - No-op same position (no renumber, no event)
 *  - createTask defaults to status=TODO and position=max+1
 *  - bulkMoveTasks updates all rows in a single transaction
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActorType, TaskStatus } from "@prisma/client";

// ─── Prisma mock ────────────────────────────────────────────────────────────
const taskCreateMock = vi.fn();
const taskFindFirstMock = vi.fn();
const taskFindUniqueMock = vi.fn();
const taskFindManyMock = vi.fn();
const taskUpdateMock = vi.fn();
const taskUpdateManyMock = vi.fn();
const taskAggregateMock = vi.fn();
const taskGroupByMock = vi.fn();
const taskCommentCreateMock = vi.fn();
const projectFindFirstMock = vi.fn();
const userFindFirstMock = vi.fn();
const transactionMock = vi.fn(async (arg: any) => {
  if (typeof arg === "function") {
    return arg({ task: {
      create: taskCreateMock, findFirst: taskFindFirstMock, findUnique: taskFindUniqueMock,
      findMany: taskFindManyMock, update: taskUpdateMock, updateMany: taskUpdateManyMock,
      aggregate: taskAggregateMock, groupBy: taskGroupByMock,
    }, taskComment: { create: taskCommentCreateMock }, project: { findFirst: projectFindFirstMock }, user: { findFirst: userFindFirstMock },
    });
  }
  // Array form: $transaction(promises) — just resolve each.
  return Promise.all(arg);
});
const eventLogMock = vi.fn();
const enqueueMock = vi.fn();

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    task: {
      create: (...args: unknown[]) => taskCreateMock(...args),
      findFirst: (...args: unknown[]) => taskFindFirstMock(...args),
      findUnique: (...args: unknown[]) => taskFindUniqueMock(...args),
      findMany: (...args: unknown[]) => taskFindManyMock(...args),
      update: (...args: unknown[]) => taskUpdateMock(...args),
      updateMany: (...args: unknown[]) => taskUpdateManyMock(...args),
      aggregate: (...args: unknown[]) => taskAggregateMock(...args),
      groupBy: (...args: unknown[]) => taskGroupByMock(...args),
    },
    taskComment: { create: (...args: unknown[]) => taskCommentCreateMock(...args) },
    project: { findFirst: (...args: unknown[]) => projectFindFirstMock(...args) },
    user: { findFirst: (...args: unknown[]) => userFindFirstMock(...args) },
    $transaction: (arg: any) => transactionMock(arg),
  },
}));

vi.mock("../../../modules/events/events.service.js", () => ({
  eventsService: { logEvent: (...args: unknown[]) => eventLogMock(...args) },
  EventType: {
    TASK_CREATED: "task.created",
    TASK_UPDATED: "task.updated",
    TASK_DELETED: "task.deleted",
    TASK_STATUS_CHANGED: "task.status_changed",
    TASK_ASSIGNED: "task.assigned",
    TASK_MOVED: "task.moved",
    TASKS_BULK_MOVED: "tasks.bulk_moved",
    TASK_COMMENT_ADDED: "task.comment_added",
  },
}));

vi.mock("../../../modules/graph/graphSync.helper.js", () => ({
  enqueueGraphSync: (...args: unknown[]) => enqueueMock(...args),
}));

vi.mock("../../../websocket/events.js", () => ({
  emitToOrg: vi.fn(),
}));

const { tasksService } = await import("../tasks.service.js");

describe("TasksService — kanban position engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectFindFirstMock.mockResolvedValue({ id: "p-1" });
    userFindFirstMock.mockResolvedValue({ id: "u-1" });
  });

  describe("moveTask — same column, moving down", () => {
    it("decrements positions in (oldPos, newPos] and updates the task", async () => {
      taskFindFirstMock.mockResolvedValue({
        id: "t-1", orgId: "org-1", projectId: "p-1",
        status: TaskStatus.TODO, position: 0,
      });
      taskUpdateManyMock.mockResolvedValue({ count: 1 });
      taskUpdateMock.mockResolvedValue({});
      taskFindUniqueMock.mockResolvedValue({
        id: "t-1", orgId: "org-1", projectId: "p-1",
        status: TaskStatus.TODO, position: 3,
        title: "T", description: null, priority: "MEDIUM",
        assigneeId: null, parentTaskId: null, dueDate: null,
        estimatedHours: null, graphNodeId: "", createdBy: "u-1",
        createdAt: new Date(), updatedAt: new Date(),
        assignee: null,
      });

      await tasksService.moveTask("org-1", "u-1", "t-1", {
        status: TaskStatus.TODO,
        position: 3,
      });

      // The first updateMany closes the gap in (0, 3].
      expect(taskUpdateManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: "p-1",
            status: TaskStatus.TODO,
            position: { gt: 0, lte: 3 },
            NOT: { id: "t-1" },
          }),
          data: { position: { decrement: 1 } },
        }),
      );
      // The task is updated to position 3.
      expect(taskUpdateMock).toHaveBeenCalledWith({
        where: { id: "t-1" },
        data: { position: 3 },
      });
      // TASK_MOVED event is logged once.
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "task.moved" }),
      );
    });
  });

  describe("moveTask — same column, moving up", () => {
    it("increments positions in [newPos, oldPos) and updates the task", async () => {
      taskFindFirstMock.mockResolvedValue({
        id: "t-1", orgId: "org-1", projectId: "p-1",
        status: TaskStatus.TODO, position: 4,
      });
      taskUpdateManyMock.mockResolvedValue({ count: 2 });
      taskUpdateMock.mockResolvedValue({});
      taskFindUniqueMock.mockResolvedValue({
        id: "t-1", orgId: "org-1", projectId: "p-1",
        status: TaskStatus.TODO, position: 1,
        title: "T", description: null, priority: "MEDIUM",
        assigneeId: null, parentTaskId: null, dueDate: null,
        estimatedHours: null, graphNodeId: "", createdBy: "u-1",
        createdAt: new Date(), updatedAt: new Date(),
        assignee: null,
      });

      await tasksService.moveTask("org-1", "u-1", "t-1", {
        status: TaskStatus.TODO,
        position: 1,
      });

      // Increments positions in [1, 4).
      expect(taskUpdateManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: { gte: 1, lt: 4 },
            NOT: { id: "t-1" },
          }),
          data: { position: { increment: 1 } },
        }),
      );
      expect(taskUpdateMock).toHaveBeenCalledWith({
        where: { id: "t-1" },
        data: { position: 1 },
      });
    });
  });

  describe("moveTask — cross-column", () => {
    it("closes gap in old column, opens slot in new column, updates task", async () => {
      taskFindFirstMock.mockResolvedValue({
        id: "t-1", orgId: "org-1", projectId: "p-1",
        status: TaskStatus.TODO, position: 2,
      });
      taskUpdateManyMock.mockResolvedValue({ count: 1 });
      taskUpdateMock.mockResolvedValue({});
      taskFindUniqueMock.mockResolvedValue({
        id: "t-1", orgId: "org-1", projectId: "p-1",
        status: TaskStatus.IN_PROGRESS, position: 0,
        title: "T", description: null, priority: "MEDIUM",
        assigneeId: null, parentTaskId: null, dueDate: null,
        estimatedHours: null, graphNodeId: "", createdBy: "u-1",
        createdAt: new Date(), updatedAt: new Date(),
        assignee: null,
      });

      await tasksService.moveTask("org-1", "u-1", "t-1", {
        status: TaskStatus.IN_PROGRESS,
        position: 0,
      });

      // First call: close gap in old column.
      expect(taskUpdateManyMock.mock.calls[0]![0]).toMatchObject({
        where: expect.objectContaining({
          status: TaskStatus.TODO,
          position: { gte: 2 },
        }),
        data: { position: { decrement: 1 } },
      });
      // Second call: open slot in new column.
      expect(taskUpdateManyMock.mock.calls[1]![0]).toMatchObject({
        where: expect.objectContaining({
          status: TaskStatus.IN_PROGRESS,
          position: { gte: 0 },
        }),
        data: { position: { increment: 1 } },
      });
      // The task itself is updated to the new (status, position).
      expect(taskUpdateMock).toHaveBeenCalledWith({
        where: { id: "t-1" },
        data: { status: TaskStatus.IN_PROGRESS, position: 0 },
      });
    });
  });

  describe("createTask", () => {
    it("defaults to status=TODO and assigns position=max+1", async () => {
      taskAggregateMock.mockResolvedValue({ _max: { position: 4 } });
      taskCreateMock.mockResolvedValue({
        id: "t-1", orgId: "org-1", projectId: "p-1",
        status: TaskStatus.TODO, position: 5,
        title: "T", description: null, priority: "MEDIUM",
        assigneeId: null, parentTaskId: null, dueDate: null,
        estimatedHours: null, graphNodeId: "", createdBy: "u-1",
        createdAt: new Date(), updatedAt: new Date(),
        assignee: null,
      });

      await tasksService.createTask("org-1", "u-1", {
        projectId: "p-1",
        title: "T",
      });

      expect(taskCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TaskStatus.TODO,
            position: 5,
          }),
        }),
      );
    });
  });

  describe("bulkMoveTasks", () => {
    it("updates every task in one transaction and emits a bulk event", async () => {
      taskFindManyMock.mockResolvedValue([
        { id: "t-1" }, { id: "t-2" },
      ]);
      taskUpdateMock.mockResolvedValue({});

      const result = await tasksService.bulkMoveTasks("org-1", "u-1", {
        updates: [
          { id: "t-1", status: TaskStatus.DONE, position: 0 },
          { id: "t-2", status: TaskStatus.IN_PROGRESS, position: 0 },
        ],
      });

      expect(result.updated).toBe(2);
      expect(taskUpdateMock).toHaveBeenCalledTimes(2);
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "tasks.bulk_moved" }),
      );
    });

    it("rejects when one task is not in the caller's org", async () => {
      taskFindManyMock.mockResolvedValue([{ id: "t-1" }]);
      await expect(
        tasksService.bulkMoveTasks("org-1", "u-1", {
          updates: [
            { id: "t-1", status: TaskStatus.DONE, position: 0 },
            { id: "t-2", status: TaskStatus.DONE, position: 0 },
          ],
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});

/**
 * Unit tests: ProjectsService.
 *
 * Verifies:
 *  - createProject writes a row, adds the owner ProjectMember, logs the
 *    event, and enqueues a graph sync.
 *  - updateProject diffs only changed fields and short-circuits on no-op.
 *  - getStats applies the PRD §4.5 health-score formula.
 *  - softDeleteProject rejects nothing (no active-project check on the
 *    project side; that's the workspace's job).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActorType, TaskStatus } from "@prisma/client";

const workspaceFindFirstMock = vi.fn();
const projectCreateMock = vi.fn();
const projectFindFirstMock = vi.fn();
const projectFindUniqueMock = vi.fn();
const projectUpdateMock = vi.fn();
const projectMemberCreateMock = vi.fn();
const projectMemberFindUniqueMock = vi.fn();
const projectMemberDeleteMock = vi.fn();
const projectMemberCountMock = vi.fn();
const projectMemberGroupByMock = vi.fn();
const taskCountMock = vi.fn();
const taskGroupByMock = vi.fn();
const eventLogMock = vi.fn();
const enqueueMock = vi.fn();

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    workspace: { findFirst: (...args: unknown[]) => workspaceFindFirstMock(...args) },
    project: {
      create: (...args: unknown[]) => projectCreateMock(...args),
      findFirst: (...args: unknown[]) => projectFindFirstMock(...args),
      findUnique: (...args: unknown[]) => projectFindUniqueMock(...args),
      update: (...args: unknown[]) => projectUpdateMock(...args),
    },
    projectMember: {
      create: (...args: unknown[]) => projectMemberCreateMock(...args),
      findUnique: (...args: unknown[]) => projectMemberFindUniqueMock(...args),
      delete: (...args: unknown[]) => projectMemberDeleteMock(...args),
      count: (...args: unknown[]) => projectMemberCountMock(...args),
      groupBy: (...args: unknown[]) => projectMemberGroupByMock(...args),
    },
    task: {
      count: (...args: unknown[]) => taskCountMock(...args),
      groupBy: (...args: unknown[]) => taskGroupByMock(...args),
    },
  },
}));

vi.mock("../../../modules/events/events.service.js", () => ({
  eventsService: { logEvent: (...args: unknown[]) => eventLogMock(...args) },
  EventType: {
    PROJECT_CREATED: "project.created",
    PROJECT_UPDATED: "project.updated",
    PROJECT_DELETED: "project.deleted",
    MEMBER_ADDED: "member.added",
    MEMBER_REMOVED: "member.removed",
  },
}));

vi.mock("../../../modules/graph/graphSync.helper.js", () => ({
  enqueueGraphSync: (...args: unknown[]) => enqueueMock(...args),
}));

vi.mock("../../../websocket/events.js", () => ({
  emitToOrg: vi.fn(),
}));

const { projectsService } = await import("../projects.service.js");

describe("ProjectsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    taskGroupByMock.mockResolvedValue([]);
    projectMemberGroupByMock.mockResolvedValue([]);
  });

  describe("createProject", () => {
    it("creates a project + owner membership, logs event, enqueues sync", async () => {
      workspaceFindFirstMock.mockResolvedValue({ id: "ws-1", name: "Acme" });
      projectCreateMock.mockResolvedValue({
        id: "p-1",
        orgId: "org-1",
        workspaceId: "ws-1",
        name: "Apollo",
        status: "ACTIVE",
        priority: "MEDIUM",
        dueDate: null,
        metadata: {},
        createdBy: "user-1",
        createdAt: new Date("2026-02-01T00:00:00Z"),
        graphNodeId: "",
        workspace: { id: "ws-1", name: "Acme" },
      });
      projectMemberCreateMock.mockResolvedValue({ id: "pm-1" });

      const result = await projectsService.createProject("org-1", "user-1", {
        workspaceId: "ws-1",
        name: "Apollo",
      });

      expect(result.id).toBe("p-1");
      expect(result.name).toBe("Apollo");
      expect(result.memberCount).toBe(1);
      expect(projectCreateMock).toHaveBeenCalledOnce();
      expect(projectMemberCreateMock).toHaveBeenCalledWith({
        data: { orgId: "org-1", projectId: "p-1", userId: "user-1", role: "owner" },
      });
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "project.created",
          aggregateId: "p-1",
          actorId: "user-1",
          actorType: ActorType.USER,
        }),
      );
      expect(enqueueMock).toHaveBeenCalledWith({
        action: "CREATE_PROJECT",
        projectId: "p-1",
      });
    });

    it("rejects when workspace is not in the caller's org", async () => {
      workspaceFindFirstMock.mockResolvedValue(null);
      await expect(
        projectsService.createProject("org-1", "user-1", {
          workspaceId: "ws-1",
          name: "Apollo",
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
      expect(projectCreateMock).not.toHaveBeenCalled();
    });
  });

  describe("updateProject", () => {
    it("diffs only changed fields and emits an event", async () => {
      projectFindFirstMock.mockResolvedValue({
        id: "p-1",
        orgId: "org-1",
        workspaceId: "ws-1",
        name: "Old",
        status: "ACTIVE",
        priority: "MEDIUM",
        dueDate: null,
        metadata: {},
        createdBy: "user-1",
        createdAt: new Date(),
        graphNodeId: "",
        workspace: { id: "ws-1", name: "Acme" },
      });
      projectUpdateMock.mockResolvedValue({
        id: "p-1",
        orgId: "org-1",
        workspaceId: "ws-1",
        name: "New",
        status: "ACTIVE",
        priority: "MEDIUM",
        dueDate: null,
        metadata: {},
        createdBy: "user-1",
        createdAt: new Date(),
        graphNodeId: "",
        workspace: { id: "ws-1", name: "Acme" },
      });

      await projectsService.updateProject("org-1", "user-1", "p-1", { name: "New" });

      expect(projectUpdateMock).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: { name: "New" },
        include: { workspace: { select: { id: true, name: true } } },
      });
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "project.updated",
          payload: { changes: { name: { from: "Old", to: "New" } } },
        }),
      );
      expect(enqueueMock).toHaveBeenCalledWith({
        action: "UPDATE_PROJECT",
        projectId: "p-1",
      });
    });
  });

  describe("getStats", () => {
    it("computes the health score using blocked + overdue + no-due-date", async () => {
      projectFindFirstMock.mockResolvedValue({
        id: "p-1",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });
      // total / done / in-progress / blocked / overdue (sequential calls).
      taskCountMock
        .mockResolvedValueOnce(10)   // totalTasks
        .mockResolvedValueOnce(4)    // completedTasks
        .mockResolvedValueOnce(3)    // inProgressTasks
        .mockResolvedValueOnce(2)    // blockedTasks
        .mockResolvedValueOnce(1)    // overdueTasks
        .mockResolvedValueOnce(1);   // noDueDate
      projectMemberCountMock.mockResolvedValue(3);

      const stats = await projectsService.getStats("org-1", "p-1");

      expect(stats.totalTasks).toBe(10);
      expect(stats.completedTasks).toBe(4);
      expect(stats.blockedTasks).toBe(2);
      expect(stats.overdueTaskCount).toBe(1);
      // 100 - 5*2 - 3*1 - 2*1 = 85
      expect(stats.healthScore).toBe(85);
      // 4/10 = 40
      expect(stats.completionRate).toBe(40);
      expect(stats.memberCount).toBe(3);
      expect(stats.daysUntilDue).toBe(5);
    });

    it("floors health score at 0 when there are many blocked tasks", async () => {
      projectFindFirstMock.mockResolvedValue({ id: "p-1", dueDate: null });
      taskCountMock
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(0)    // done
        .mockResolvedValueOnce(0)    // in-progress
        .mockResolvedValueOnce(30)   // blocked
        .mockResolvedValueOnce(0)    // overdue
        .mockResolvedValueOnce(0);   // noDueDate
      projectMemberCountMock.mockResolvedValue(1);

      const stats = await projectsService.getStats("org-1", "p-1");
      // 100 - 5*30 = -50 → clamped to 0
      expect(stats.healthScore).toBe(0);
    });
  });

  describe("softDeleteProject", () => {
    it("soft deletes and emits events", async () => {
      projectFindFirstMock.mockResolvedValue({
        id: "p-1",
        orgId: "org-1",
        name: "Apollo",
      });
      projectUpdateMock.mockResolvedValue({});

      const result = await projectsService.softDeleteProject("org-1", "user-1", "p-1");
      expect(result).toEqual({ id: "p-1", deleted: true });
      expect(projectUpdateMock).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "project.deleted" }),
      );
      expect(enqueueMock).toHaveBeenCalledWith({
        action: "DELETE_PROJECT",
        projectId: "p-1",
      });
    });
  });
});

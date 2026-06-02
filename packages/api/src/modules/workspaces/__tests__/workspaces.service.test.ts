/**
 * Unit tests: WorkspacesService.
 *
 * Verifies:
 *  - createWorkspace writes a row, logs an event, and enqueues a sync.
 *  - updateWorkspace diffs only the changed fields and short-circuits when
 *    nothing actually changes (no event, no queue job).
 *  - softDeleteWorkspace rejects with WORKSPACE_HAS_PROJECTS when active
 *    projects still live inside, and succeeds when the workspace is empty
 *    (or only contains archived projects).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActorType } from "@prisma/client";

// ─── Prisma mock ────────────────────────────────────────────────────────────
const workspaceCreateMock = vi.fn();
const workspaceUpdateMock = vi.fn();
const workspaceFindFirstMock = vi.fn();
const workspaceFindUniqueMock = vi.fn();
const projectCountMock = vi.fn();
const userCountMock = vi.fn();
const userFindFirstMock = vi.fn();
const eventLogMock = vi.fn();
const enqueueMock = vi.fn();

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    workspace: {
      create: (...args: unknown[]) => workspaceCreateMock(...args),
      update: (...args: unknown[]) => workspaceUpdateMock(...args),
      findFirst: (...args: unknown[]) => workspaceFindFirstMock(...args),
      findUnique: (...args: unknown[]) => workspaceFindUniqueMock(...args),
    },
    project: {
      count: (...args: unknown[]) => projectCountMock(...args),
    },
    user: {
      count: (...args: unknown[]) => userCountMock(...args),
      findFirst: (...args: unknown[]) => userFindFirstMock(...args),
    },
  },
}));

vi.mock("../../../modules/events/events.service.js", () => ({
  eventsService: {
    logEvent: (...args: unknown[]) => eventLogMock(...args),
  },
  EventType: {
    WORKSPACE_CREATED: "workspace.created",
    WORKSPACE_UPDATED: "workspace.updated",
    WORKSPACE_DELETED: "workspace.deleted",
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

const { workspacesService } = await import("../workspaces.service.js");

describe("WorkspacesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userCountMock.mockResolvedValue(0);
    projectCountMock.mockResolvedValue(0);
  });

  describe("createWorkspace", () => {
    it("creates a row, logs an event, and enqueues a graph sync", async () => {
      const created = {
        id: "ws-1",
        orgId: "org-1",
        name: "Acme",
        description: null,
        createdBy: "user-1",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        graphNodeId: "",
      };
      workspaceCreateMock.mockResolvedValue(created);

      const result = await workspacesService.createWorkspace("org-1", "user-1", {
        name: "Acme",
      });

      expect(workspaceCreateMock).toHaveBeenCalledWith({
        data: {
          orgId: "org-1",
          name: "Acme",
          description: null,
          createdBy: "user-1",
          graphNodeId: "",
        },
      });
      expect(result.id).toBe("ws-1");
      expect(result.name).toBe("Acme");
      expect(result.orgId).toBe("org-1");
      expect(result.projectCount).toBe(0);
      expect(result.memberCount).toBe(0);

      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: "org-1",
          type: "workspace.created",
          aggregateId: "ws-1",
          aggregateType: "workspace",
          actorId: "user-1",
          actorType: ActorType.USER,
        }),
      );
      expect(enqueueMock).toHaveBeenCalledWith({
        action: "CREATE_WORKSPACE",
        workspaceId: "ws-1",
      });
    });
  });

  describe("updateWorkspace", () => {
    it("diffs only the changed fields and emits an UPDATE event", async () => {
      workspaceFindFirstMock.mockResolvedValue({
        id: "ws-1",
        orgId: "org-1",
        name: "Old",
        description: "Old desc",
        createdBy: "user-1",
        createdAt: new Date(),
        graphNodeId: "",
      });
      workspaceUpdateMock.mockResolvedValue({
        id: "ws-1",
        orgId: "org-1",
        name: "New",
        description: "Old desc",
        createdBy: "user-1",
        createdAt: new Date(),
        graphNodeId: "",
      });

      await workspacesService.updateWorkspace("org-1", "user-1", "ws-1", {
        name: "New",
      });

      expect(workspaceUpdateMock).toHaveBeenCalledWith({
        where: { id: "ws-1" },
        data: { name: "New" },
      });
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "workspace.updated",
          payload: {
            changes: { name: { from: "Old", to: "New" } },
          },
        }),
      );
      expect(enqueueMock).toHaveBeenCalledWith({
        action: "UPDATE_WORKSPACE",
        workspaceId: "ws-1",
      });
    });

    it("short-circuits when no fields actually changed", async () => {
      workspaceFindFirstMock.mockResolvedValue({
        id: "ws-1",
        orgId: "org-1",
        name: "Same",
        description: "Same",
        createdBy: "user-1",
        createdAt: new Date(),
        graphNodeId: "",
      });
      workspaceFindUniqueMock.mockResolvedValue({
        id: "ws-1",
        orgId: "org-1",
        name: "Same",
        description: "Same",
        createdBy: "user-1",
        createdAt: new Date(),
        graphNodeId: "",
        _count: { projects: 0 },
      });

      await workspacesService.updateWorkspace("org-1", "user-1", "ws-1", {
        name: "Same",
      });

      expect(workspaceUpdateMock).not.toHaveBeenCalled();
      expect(eventLogMock).not.toHaveBeenCalled();
      expect(enqueueMock).not.toHaveBeenCalled();
    });
  });

  describe("softDeleteWorkspace", () => {
    it("rejects with WORKSPACE_HAS_PROJECTS when active projects exist", async () => {
      workspaceFindFirstMock.mockResolvedValue({
        id: "ws-1",
        orgId: "org-1",
        name: "Acme",
        createdBy: "user-1",
        createdAt: new Date(),
        graphNodeId: "",
      });
      projectCountMock.mockResolvedValue(2);

      await expect(
        workspacesService.softDeleteWorkspace("org-1", "user-1", "ws-1"),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "WORKSPACE_HAS_PROJECTS",
      });
      expect(workspaceUpdateMock).not.toHaveBeenCalled();
    });

    it("soft deletes when no active projects remain", async () => {
      workspaceFindFirstMock.mockResolvedValue({
        id: "ws-1",
        orgId: "org-1",
        name: "Acme",
        createdBy: "user-1",
        createdAt: new Date(),
        graphNodeId: "",
      });
      projectCountMock.mockResolvedValue(0);
      workspaceUpdateMock.mockResolvedValue({});

      const result = await workspacesService.softDeleteWorkspace(
        "org-1",
        "user-1",
        "ws-1",
      );

      expect(result).toEqual({ id: "ws-1", deleted: true });
      expect(workspaceUpdateMock).toHaveBeenCalledWith({
        where: { id: "ws-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "workspace.deleted" }),
      );
      expect(enqueueMock).toHaveBeenCalledWith({
        action: "DELETE_WORKSPACE",
        workspaceId: "ws-1",
      });
    });
  });
});

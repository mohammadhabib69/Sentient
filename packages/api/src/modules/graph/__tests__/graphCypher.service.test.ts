/**
 * Unit tests: GraphCypherService dispatcher.
 *
 * Verifies the per-action routing table: when `handle(job)` is called
 * with a CREATE_WORKSPACE job, `syncWorkspace` is called with the
 * same workspaceId. Other actions route to their respective methods.
 *
 * The actual Cypher is exercised in the e2e test (which needs a live
 * Neo4j); here we just check the routing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const workspaceFindUniqueMock = vi.fn();
const projectFindUniqueMock = vi.fn();
const taskFindUniqueMock = vi.fn();
const runMock = vi.fn();
const sessionCloseMock = vi.fn();
const sessionRunMock = vi.fn();
const sessionMock = vi.fn(() => ({
  run: sessionRunMock,
  close: sessionCloseMock,
}));

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    workspace: { findUnique: (...a: unknown[]) => workspaceFindUniqueMock(...a) },
    project: { findUnique: (...a: unknown[]) => projectFindUniqueMock(...a) },
    task: { findUnique: (...a: unknown[]) => taskFindUniqueMock(...a) },
  },
}));

vi.mock("../../../config/neo4j.js", () => ({
  neo4jDriver: {
    session: () => ({
      run: (...a: unknown[]) => sessionRunMock(...a),
      close: (...a: unknown[]) => sessionCloseMock(...a),
    }),
  },
}));

const { graphCypherService } = await import("../graphCypher.service.js");

describe("GraphCypherService.handle — dispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("CREATE_WORKSPACE → runs a MERGE for the workspace", async () => {
    workspaceFindUniqueMock.mockResolvedValue({
      id: "ws-1",
      orgId: "org-1",
      name: "Acme",
      deletedAt: null,
      organization: { name: "Acme Co", plan: "PRO", slug: "acme" },
    });
    sessionRunMock.mockResolvedValue({});

    await graphCypherService.handle({
      action: "CREATE_WORKSPACE",
      workspaceId: "ws-1",
    });
    expect(workspaceFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      include: { organization: true },
    });
    expect(sessionRunMock).toHaveBeenCalled();
    const cypher = sessionRunMock.mock.calls[0]![0] as string;
    expect(cypher).toMatch(/MERGE \(w:Workspace \{id: \$id\}\)/);
  });

  it("DELETE_WORKSPACE → runs a DETACH DELETE", async () => {
    sessionRunMock.mockResolvedValue({});
    await graphCypherService.handle({
      action: "DELETE_WORKSPACE",
      workspaceId: "ws-1",
    });
    const cypher = sessionRunMock.mock.calls[0]![0] as string;
    expect(cypher).toMatch(/DETACH DELETE w/);
  });

  it("CREATE_TASK → runs a MERGE for the task", async () => {
    taskFindUniqueMock.mockResolvedValue({
      id: "t-1",
      orgId: "org-1",
      projectId: "p-1",
      title: "T",
      status: "TODO",
      priority: "MEDIUM",
      position: 0,
      deletedAt: null,
      parentTaskId: null,
      assigneeId: null,
      project: {},
    });
    sessionRunMock.mockResolvedValue({});
    await graphCypherService.handle({ action: "CREATE_TASK", taskId: "t-1" });
    expect(taskFindUniqueMock).toHaveBeenCalled();
    expect(sessionRunMock).toHaveBeenCalled();
  });

  it("REBUILD_ORG_GRAPH is a no-op (the worker handles it)", async () => {
    await graphCypherService.handle({
      action: "REBUILD_ORG_GRAPH",
      orgId: "org-1",
    });
    expect(sessionRunMock).not.toHaveBeenCalled();
  });
});

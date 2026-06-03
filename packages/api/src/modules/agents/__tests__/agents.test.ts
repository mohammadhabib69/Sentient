/**
 * Unit tests: Phase 8 agents module.
 *
 * Verifies:
 *  - Embedding service: embedText, storeMemory, retrieveMemory, clearMemory
 *  - HITL service: createPendingAction, approveAction, rejectAction
 *  - Action executor: dispatchActionExecution (validation guards)
 *  - Trigger processor: processTriggers filters and enqueues correctly
 *
 * NOTE: These are unit tests that mock dependencies at the config layer.
 * Integration tests (hitting a real DB/OpenAI) should be added separately.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the OpenAI SDK at the package level ──────────────────────────

const mockEmbeddingsCreate = vi.fn().mockResolvedValue({
  data: [{ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }],
});

vi.mock("openai", () => ({
  default: class {
    embeddings = { create: mockEmbeddingsCreate };
    chat = { completions: { create: vi.fn() } };
  },
}));

// ─── Shared mock state ──────────────────────────────────────────────────

// Prisma mocks
const execRawMock = vi.fn().mockResolvedValue(undefined);
const queryRawMock = vi.fn().mockResolvedValue([]);
const deleteManyMock = vi.fn().mockResolvedValue({ count: 3 });
const findManyMock = vi.fn().mockResolvedValue([]);
const findFirstMock = vi.fn().mockResolvedValue(null);
const createMock = vi.fn();
const updateMock = vi.fn().mockResolvedValue({});
const countMock = vi.fn().mockResolvedValue(0);
const groupByMock = vi.fn().mockResolvedValue([]);
const agentUpdateMock = vi.fn().mockResolvedValue({});
const eventCreateMock = vi.fn();
const eventAggregateMock = vi.fn().mockResolvedValue({ _max: { version: null } });

// Queue mocks
const aiQueueAddMock = vi.fn().mockResolvedValue({ id: "job-1" });

// Socket mocks
const emitToOrgMock = vi.fn();
const emitToUserMock = vi.fn();

// ─── Module mocks (static vi.mock calls — vitest hoists these) ──────────

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    $executeRaw: (...args: unknown[]) => execRawMock(...args),
    $queryRaw: (...args: unknown[]) => queryRawMock(...args),
    agentMemory: {
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    agentAction: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
    agent: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      findMany: (...args: unknown[]) => findManyMock(...args),
      update: (...args: unknown[]) => agentUpdateMock(...args),
    },
    task: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      count: (...args: unknown[]) => countMock(...args),
      groupBy: (...args: unknown[]) => groupByMock(...args),
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    project: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
    projectReadModel: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    user: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    notification: {
      create: (...args: unknown[]) => createMock(...args),
    },
    taskComment: {
      create: (...args: unknown[]) => createMock(...args),
    },
    event: {
      aggregate: (...args: unknown[]) => eventAggregateMock(...args),
      create: (...args: unknown[]) => eventCreateMock(...args),
      count: (...args: unknown[]) => countMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
    eventOutbox: {
      create: (...args: unknown[]) => createMock(...args),
    },
    $transaction: vi.fn().mockImplementation(async (fn: any) => {
      if (Array.isArray(fn)) return fn.map(() => undefined);
      const now = new Date();
      const tx = {
        event: { create: vi.fn().mockResolvedValue({ id: "evt-1", type: "test", occurredAt: now, version: 1, orgId: "org-1", aggregateId: "agg-1", aggregateType: "agent", payload: {}, actorId: "agent-1", actorType: "AGENT", causationId: null, correlationId: null }) },
        eventOutbox: { create: vi.fn().mockResolvedValue({ id: "outbox-1" }) },
        agentAction: { update: vi.fn().mockResolvedValue({}) },
        agent: { update: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    }),
  },
}));

vi.mock("../../../websocket/events.js", () => ({
  emitToOrg: (...args: unknown[]) => emitToOrgMock(...args),
  emitToUser: (...args: unknown[]) => emitToUserMock(...args),
}));

vi.mock("../../../jobs/queues.js", () => ({
  aiQueue: { add: (...args: unknown[]) => aiQueueAddMock(...args) },
  emailQueue: { add: vi.fn() },
  webhookQueue: { add: vi.fn() },
  pdfQueue: { add: vi.fn() },
  graphSyncQueue: { add: vi.fn() },
  notificationQueue: { add: vi.fn() },
  billingQueue: { add: vi.fn() },
  sessionCleanupQueue: { add: vi.fn() },
  defaultJobOptions: {},
}));

vi.mock("../../../utils/errors.js", () => {
  class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NotFoundError";
    }
  }
  class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode: number, code: string) {
      super(message);
      this.name = "AppError";
      this.statusCode = statusCode;
      this.code = code;
    }
  }
  class ValidationError extends Error {
    errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>) {
      super("Validation failed");
      this.name = "ValidationError";
      this.errors = errors;
    }
  }
  return { NotFoundError, AppError, ValidationError };
});

// ─── Embedding service tests ─────────────────────────────────────────────

describe("Embedding Service (Phase 8 §3.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }],
    });
  });

  it("embedText returns the embedding vector from OpenAI", async () => {
    const { embedText } = await import("../embedding.service.js");
    const result = await embedText("hello world");
    expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "hello world",
    });
  });

  it("embedText truncates input to 8192 chars", async () => {
    const { embedText } = await import("../embedding.service.js");
    const longText = "x".repeat(10000);
    await embedText(longText);
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: longText.slice(0, 8192),
    });
  });

  it("storeMemory writes INSERT via raw SQL", async () => {
    const { storeMemory } = await import("../embedding.service.js");
    await storeMemory({
      agentId: "agent-1",
      namespace: "ops",
      content: "task is overdue",
      metadata: { timestamp: "2026-06-03" },
    });
    expect(execRawMock).toHaveBeenCalled();
  });

  it("retrieveMemory queries via cosine similarity", async () => {
    queryRawMock.mockResolvedValue([
      {
        content: "task is overdue",
        similarity: 0.92,
        metadata: { timestamp: "2026-06-03" },
      },
    ]);
    const { retrieveMemory } = await import("../embedding.service.js");
    const result = await retrieveMemory({
      agentId: "agent-1",
      namespace: "ops",
      query: "deadline missed",
      topK: 3,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.similarity).toBe(0.92);
  });

  it("clearMemory deletes all memories for an agent namespace", async () => {
    const { clearMemory } = await import("../embedding.service.js");
    await clearMemory("agent-1", "ops");
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { agentId: "agent-1", namespace: "ops" },
    });
  });
});

// ─── HITL service tests ──────────────────────────────────────────────────

describe("HITL Service (Phase 8 §5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
  });

  it("createPendingAction creates a PENDING action and emits socket event", async () => {
    findFirstMock.mockResolvedValue({
      id: "agent-1",
      name: "Aria",
      type: "operations",
      approvalMode: "ALWAYS",
    });
    createMock.mockResolvedValue({
      id: "action-1",
      createdAt: new Date(),
    });

    const { createPendingAction } = await import("../hitl.service.js");
    const actionId = await createPendingAction({
      agentId: "agent-1",
      orgId: "org-1",
      actionType: "reassign_task",
      description: "Reassign task X",
      payload: { taskId: "task-1", newAssigneeId: "user-2" },
      riskLevel: "low",
      confidence: 0.80,
    });

    expect(actionId).toBe("action-1");
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
        }),
      }),
    );
    expect(emitToOrgMock).toHaveBeenCalledWith(
      "org-1",
      "agent:action_pending",
      expect.objectContaining({
        action: expect.objectContaining({
          agentId: "agent-1",
          agentName: "Aria",
        }),
      }),
    );
  });

  it("createPendingAction auto-approves when conditions are met", async () => {
    findFirstMock.mockResolvedValue({
      id: "agent-1",
      name: "Aria",
      type: "operations",
      approvalMode: "AUTO_LOW_RISK",
    });
    createMock.mockResolvedValue({
      id: "action-auto",
      createdAt: new Date(),
    });

    const { createPendingAction } = await import("../hitl.service.js");
    await createPendingAction({
      agentId: "agent-1",
      orgId: "org-1",
      actionType: "send_notification",
      description: "Auto-approved notification",
      payload: { userId: "user-1", title: "Alert" },
      riskLevel: "low",
      confidence: 0.90, // above AGENT_AUTO_APPROVE_THRESHOLD (0.85)
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
        }),
      }),
    );
    // Auto-approved → no socket emit for pending
    expect(emitToOrgMock).not.toHaveBeenCalledWith(
      "org-1",
      "agent:action_pending",
      expect.any(Object),
    );
  });

  it("createPendingAction throws NotFoundError when agent not found", async () => {
    findFirstMock.mockResolvedValue(null);

    const { createPendingAction } = await import("../hitl.service.js");
    await expect(
      createPendingAction({
        agentId: "nonexistent",
        orgId: "org-1",
        actionType: "test",
        description: "test",
        payload: {},
        riskLevel: "low",
        confidence: 0.5,
      }),
    ).rejects.toThrow("Agent");
  });
});

// ─── Trigger processor tests ─────────────────────────────────────────────

describe("Trigger Processor (Phase 8 §6.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstMock.mockReset();
    findManyMock.mockReset();
    countMock.mockReset();
    groupByMock.mockReset();
    aiQueueAddMock.mockClear();
  });

  it("processTriggers skips agent.* events to avoid infinite loops", async () => {
    const { processTriggers } = await import("../triggers/trigger.processor.js");
    await processTriggers({
      id: "evt-1",
      type: "agent.run.completed",
      orgId: "org-1",
      aggregateId: "agent-1",
      aggregateType: "agent",
      payload: {},
      actorId: "agent-1",
      actorType: "AGENT",
      version: 1,
      occurredAt: new Date().toISOString(),
    });
    expect(aiQueueAddMock).not.toHaveBeenCalled();
  });

  it("processTriggers skips events with no matching trigger", async () => {
    const { processTriggers } = await import("../triggers/trigger.processor.js");
    await processTriggers({
      id: "evt-2",
      type: "workspace.created",
      orgId: "org-1",
      aggregateId: "ws-1",
      aggregateType: "workspace",
      payload: {},
      actorId: "user-1",
      actorType: "USER",
      version: 1,
      occurredAt: new Date().toISOString(),
    });
    expect(aiQueueAddMock).not.toHaveBeenCalled();
  });

  it("processTriggers skips task.created when no workload imbalance exists", async () => {
    groupByMock.mockResolvedValue([
      { assigneeId: "user-1", _count: { id: 3 } },
      { assigneeId: "user-2", _count: { id: 4 } },
    ]);
    findFirstMock.mockResolvedValue(null); // no active agent

    const { processTriggers } = await import("../triggers/trigger.processor.js");
    await processTriggers({
      id: "evt-3",
      type: "task.created",
      orgId: "org-1",
      aggregateId: "task-1",
      aggregateType: "task",
      payload: { title: "New task" },
      actorId: "user-1",
      actorType: "USER",
      version: 1,
      occurredAt: new Date().toISOString(),
    });
    // Should not enqueue because diff is only 1 (< 5 threshold)
    expect(aiQueueAddMock).not.toHaveBeenCalled();
  });

  it("processTriggers enqueues a job when Nova trigger matches finance task", async () => {
    findFirstMock.mockResolvedValue({
      id: "nova-agent",
      name: "Nova",
      type: "finance",
      isActive: true,
    });

    const { processTriggers } = await import("../triggers/trigger.processor.js");
    await processTriggers({
      id: "evt-4",
      type: "task.created",
      orgId: "org-1",
      aggregateId: "task-2",
      aggregateType: "task",
      payload: { title: "Pay invoice #1234" },
      actorId: "user-1",
      actorType: "USER",
      version: 1,
      occurredAt: new Date().toISOString(),
    });

    expect(aiQueueAddMock).toHaveBeenCalledWith(
      "run-agent",
      expect.objectContaining({
        agentId: "nova-agent",
        agentType: "finance",
        orgId: "org-1",
      }),
      expect.any(Object),
    );
  });

  it("processTriggers skips when no active agent of matching type exists", async () => {
    findFirstMock.mockResolvedValue(null); // no active agent

    const { processTriggers } = await import("../triggers/trigger.processor.js");
    await processTriggers({
      id: "evt-5",
      type: "task.created",
      orgId: "org-1",
      aggregateId: "task-3",
      aggregateType: "task",
      payload: { title: "Pay invoice #5678" },
      actorId: "user-1",
      actorType: "USER",
      version: 1,
      occurredAt: new Date().toISOString(),
    });
    expect(aiQueueAddMock).not.toHaveBeenCalled();
  });
});

// ─── Action executor validation tests ────────────────────────────────────

describe("Action Executor validation (Phase 8 §5.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
  });

  it("dispatchActionExecution throws for unknown action type", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "unknown_action",
        payload: {},
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("Unknown action type");
  });

  it("executeReassignTask validates required payload fields", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "reassign_task",
        payload: { orgId: "org-1" }, // missing taskId and newAssigneeId
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("taskId, newAssigneeId");
  });

  it("executeCreateTask validates required fields", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "create_task",
        payload: {}, // missing projectId, orgId, title
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("projectId, orgId, title");
  });

  it("executeSendNotification validates required fields", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "send_notification",
        payload: {}, // missing userId, orgId, title
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("userId, orgId, title");
  });

  it("executePostComment validates required fields", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "post_comment",
        payload: {}, // missing taskId, orgId, content
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("taskId, orgId, content");
  });

  it("executeUpdateTaskPriority validates required fields", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "update_task_priority",
        payload: {}, // missing taskId, priority, orgId
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("taskId, priority, orgId");
  });

  it("executeUpdateTaskDueDate validates required fields", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "update_task_due_date",
        payload: {}, // missing taskId, dueDate, orgId
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("taskId, dueDate, orgId");
  });

  it("executeUpdateTaskStatus validates required fields", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "update_task_status",
        payload: {}, // missing taskId, status, orgId
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("taskId, status, orgId");
  });

  it("executeFlagOverdueProject validates required fields", async () => {
    const { dispatchActionExecution } = await import("../action.executor.js");
    await expect(
      dispatchActionExecution({
        actionType: "flag_overdue_project",
        payload: {}, // missing projectId, orgId
        agent: { id: "agent-1" } as any,
      } as any),
    ).rejects.toThrow("projectId, orgId");
  });
});

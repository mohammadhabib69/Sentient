/**
 * Unit tests: EventsService.logEvent version increment.
 *
 * Verifies that:
 *  - logEvent starts at version 1 for a fresh aggregate.
 *  - Subsequent calls on the same (type, id) increment monotonically.
 *  - Distinct (type, id) pairs are tracked independently.
 *  - The composite PK [id, occurredAt] is honored by passing an explicit
 *    occurredAt (Prisma would otherwise reject the create).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "uuid-1"),
}));

const findFirstMock = vi.fn();
const createMock = vi.fn();

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    event: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Import AFTER the mocks are in place.
const { EventsService, EventType } = await import("../events.service.js");
const { ActorType } = await import("@prisma/client");

describe("EventsService", () => {
  let svc: InstanceType<typeof EventsService>;

  beforeEach(() => {
    vi.clearAllMocks();
    findFirstMock.mockResolvedValue(null);
    createMock.mockImplementation((args: any) => ({ id: args.data.id, ...args.data }));
    svc = new EventsService();
  });

  it("assigns version 1 to the first event on a fresh aggregate", async () => {
    await svc.logEvent({
      orgId: "org-1",
      type: EventType.WORKSPACE_CREATED,
      aggregateId: "ws-1",
      aggregateType: "workspace",
      payload: { name: "Acme" },
      actorId: "user-1",
      actorType: ActorType.USER,
    });

    expect(createMock).toHaveBeenCalledOnce();
    const data = createMock.mock.calls[0]![0].data;
    expect(data.version).toBe(1);
    expect(data.id).toBe("uuid-1");
    expect(data.aggregateId).toBe("ws-1");
    expect(data.aggregateType).toBe("workspace");
    expect(data.actorType).toBe(ActorType.USER);
    expect(data.occurredAt).toBeInstanceOf(Date);
  });

  it("increments version based on the previous max for the same aggregate", async () => {
    findFirstMock.mockResolvedValue({ version: 7 });

    await svc.logEvent({
      orgId: "org-1",
      type: EventType.TASK_CREATED,
      aggregateId: "task-1",
      aggregateType: "task",
      payload: {},
      actorId: "user-1",
      actorType: ActorType.USER,
    });

    const data = createMock.mock.calls[0]![0].data;
    expect(data.version).toBe(8);
    // findFirst must have queried with the matching aggregate key.
    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { aggregateType: "task", aggregateId: "task-1" },
        orderBy: { version: "desc" },
      }),
    );
  });

  it("tracks version per (aggregateType, aggregateId) pair", async () => {
    // First call on task-1
    findFirstMock.mockResolvedValueOnce({ version: 3 });
    // Second call on a different task
    findFirstMock.mockResolvedValueOnce({ version: 0 });
    createMock.mockClear();

    await svc.logEvent({
      orgId: "org-1",
      type: EventType.TASK_UPDATED,
      aggregateId: "task-1",
      aggregateType: "task",
      payload: {},
      actorId: "user-1",
      actorType: ActorType.USER,
    });
    await svc.logEvent({
      orgId: "org-1",
      type: EventType.TASK_UPDATED,
      aggregateId: "task-2",
      aggregateType: "task",
      payload: {},
      actorId: "user-1",
      actorType: ActorType.USER,
    });

    expect(createMock.mock.calls[0]![0].data.version).toBe(4);
    expect(createMock.mock.calls[1]![0].data.version).toBe(1);
  });

  it("passes an explicit occurredAt so the composite PK is satisfied", async () => {
    await svc.logEvent({
      orgId: "org-1",
      type: EventType.PROJECT_CREATED,
      aggregateId: "proj-1",
      aggregateType: "project",
      payload: {},
      actorId: "user-1",
      actorType: ActorType.USER,
    });
    const data = createMock.mock.calls[0]![0].data;
    expect(data.occurredAt).toBeInstanceOf(Date);
  });
});

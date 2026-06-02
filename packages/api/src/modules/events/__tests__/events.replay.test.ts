/**
 * Unit tests: event replay (Phase 7 §6).
 *
 * Verifies:
 *  - Throws AppError(409) when a replay is already running for the org.
 *  - dryRun: returns count without invoking projectors.
 *  - normal run: invokes projectors with the correct envelope and returns
 *    processed count.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const setMock = vi.fn();
const delMock = vi.fn();
const findManyMock = vi.fn();

vi.mock("../../../config/redis.js", () => ({
  redisClient: {
    set: (...args: unknown[]) => setMock(...args),
    del: (...args: unknown[]) => delMock(...args),
  },
}));

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
  },
}));

const projectorFn = vi.fn().mockResolvedValue(undefined);
vi.mock("../projectors/index.js", () => ({
  runProjectors: (...args: unknown[]) => projectorFn(...args),
}));

const { replayEvents } = await import("../events.replay.js");

describe("event replay (Phase 7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMock.mockResolvedValue("OK");
    delMock.mockResolvedValue(1);
    projectorFn.mockResolvedValue(undefined);
  });

  it("rejects with 409 when a replay is already running for the org", async () => {
    setMock.mockResolvedValueOnce(null);
    await expect(
      replayEvents({ orgId: "org-1" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "REPLAY_IN_PROGRESS" });
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("dry-run: returns count without invoking projectors", async () => {
    findManyMock.mockResolvedValueOnce([
      { id: "e1", type: "task.created", version: 1, aggregateId: "t1", aggregateType: "task", orgId: "o1", actorId: "u1", actorType: "USER", payload: {}, occurredAt: new Date(), causationId: null, correlationId: null },
    ]);
    const result = await replayEvents({ orgId: "org-1", dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.processed).toBe(1);
    expect(projectorFn).not.toHaveBeenCalled();
  });

  it("normal run: invokes projectors with envelope and counts successes", async () => {
    findManyMock.mockResolvedValueOnce([
      { id: "e1", type: "task.created", version: 1, aggregateId: "t1", aggregateType: "task", orgId: "o1", actorId: "u1", actorType: "USER", payload: { x: 1 }, occurredAt: new Date("2026-06-02T00:00:00Z"), causationId: null, correlationId: null },
    ]);
    findManyMock.mockResolvedValueOnce([]);
    const result = await replayEvents({ orgId: "org-1" });
    expect(result.dryRun).toBe(false);
    expect(result.processed).toBe(1);
    expect(projectorFn).toHaveBeenCalledOnce();
    const env = projectorFn.mock.calls[0]![0] as any;
    expect(env.id).toBe("e1");
    expect(env.type).toBe("task.created");
    expect(env.payload).toEqual({ x: 1 });
    expect(delMock).toHaveBeenCalled(); // lock released
  });
});

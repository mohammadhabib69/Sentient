/**
 * Unit tests: outbox worker (Phase 7 §4).
 *
 * Verifies:
 *  - processOutboxBatch acquires a Redis lock (or no-ops if held).
 *  - Delivered entries are marked `delivered` and outbox counts move.
 *  - handleDeliveryFailure schedules retries with exponential backoff
 *    and moves to the dead-letter table on the last attempt.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const setMock = vi.fn();
const delMock = vi.fn();
const xaddMock = vi.fn();

const findManyMock = vi.fn();
const updateMock = vi.fn();
const outboxCreateMock = vi.fn();
const dlCreateMock = vi.fn();
const txMock = vi.fn(async (arg: any) => {
  if (Array.isArray(arg)) {
    return arg.map(() => undefined);
  }
  return arg({
    eventOutbox: { update: updateMock },
    eventDeadLetter: { create: dlCreateMock },
  });
});

vi.mock("../../config/redis.js", () => ({
  redisClient: {
    set: (...args: unknown[]) => setMock(...args),
    del: (...args: unknown[]) => delMock(...args),
    xadd: (...args: unknown[]) => xaddMock(...args),
  },
  bullRedisClient: {},
}));

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    eventOutbox: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      create: (...args: unknown[]) => outboxCreateMock(...args),
    },
    eventDeadLetter: {
      create: (...args: unknown[]) => dlCreateMock(...args),
    },
    $transaction: (arg: any) => txMock(arg),
  },
}));

vi.mock("../../websocket/events.js", () => ({
  emitToOrg: vi.fn(),
}));

const { processOutboxBatch, handleDeliveryFailure } = await import(
  "../outbox.worker.js"
);

describe("outbox.worker (Phase 7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMock.mockResolvedValue("OK");
    delMock.mockResolvedValue(1);
    xaddMock.mockResolvedValue("1-0");
    updateMock.mockResolvedValue({});
    outboxCreateMock.mockResolvedValue({});
    dlCreateMock.mockResolvedValue({});
  });

  it("no-ops when another process holds the lock", async () => {
    setMock.mockResolvedValueOnce(null); // SETNX failure
    const result = await processOutboxBatch();
    expect(result).toEqual({ processed: 0, errors: 0 });
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("delivers pending entries and marks them as delivered", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: "ob-1",
        eventId: "evt-1",
        orgId: "org-1",
        eventType: "task.created",
        attempts: 0,
        payload: {
          event: {
            id: "evt-1",
            type: "task.created",
            orgId: "org-1",
            aggregateId: "task-1",
            aggregateType: "task",
            actorId: "user-1",
            actorType: "USER",
            payload: {},
            version: 1,
            occurredAt: new Date().toISOString(),
          },
        },
      },
    ]);

    const result = await processOutboxBatch();
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(xaddMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ob-1" },
        data: expect.objectContaining({ status: "delivered" }),
      }),
    );
    expect(delMock).toHaveBeenCalled(); // lock released
  });

  it("skips work when no pending entries are due", async () => {
    findManyMock.mockResolvedValueOnce([]);
    const result = await processOutboxBatch();
    expect(result).toEqual({ processed: 0, errors: 0 });
  });

  it("moves an entry to the dead-letter table on the final attempt", async () => {
    const entry: any = {
      id: "ob-x",
      eventId: "evt-x",
      orgId: "org-1",
      eventType: "task.created",
      attempts: 4, // one more retry will hit MAX_RETRIES=5
      payload: { event: { id: "evt-x", type: "task.created" } },
    };
    await handleDeliveryFailure(entry, new Error("Redis down"));
    expect(txMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ob-x" },
        data: expect.objectContaining({ status: "dead_lettered" }),
      }),
    );
    expect(dlCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "evt-x",
          orgId: "org-1",
          error: "Redis down",
        }),
      }),
    );
  });

  it("schedules a retry with exponential backoff on transient failure", async () => {
    const entry: any = {
      id: "ob-y",
      eventId: "evt-y",
      orgId: "org-1",
      eventType: "task.created",
      attempts: 0,
      payload: { event: { id: "evt-y" } },
    };
    await handleDeliveryFailure(entry, new Error("flake"));
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ob-y" },
        data: expect.objectContaining({
          attempts: 1,
          lastError: "flake",
        }),
      }),
    );
    // Verify next_retry_at is in the future (exponential backoff applied).
    const updateArgs = updateMock.mock.calls[0]![0].data;
    expect(updateArgs.nextRetryAt).toBeInstanceOf(Date);
    expect(updateArgs.nextRetryAt.getTime()).toBeGreaterThan(Date.now());
  });
});

/**
 * Unit tests: events query API (Phase 7 §8).
 *
 * Verifies that the new filters — typePrefix, actorId, minVersion,
 * sortOrder — flow into the Prisma where clause correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActorType } from "@prisma/client";

const findManyMock = vi.fn();
const countMock = vi.fn();

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      count: (...args: unknown[]) => countMock(...args),
    },
  },
}));

const { EventsService } = await import("../events.service.js");

describe("EventsService.queryEvents (Phase 7 filters)", () => {
  let svc: InstanceType<typeof EventsService>;

  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);
    svc = new EventsService();
  });

  it("applies typePrefix with startsWith", async () => {
    await svc.queryEvents({ orgId: "org-1", typePrefix: "task." });
    expect(findManyMock).toHaveBeenCalledOnce();
    const args = findManyMock.mock.calls[0]![0];
    expect(args.where.type).toEqual({ startsWith: "task." });
  });

  it("applies actorId, minVersion, from, to", async () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-02-01");
    await svc.queryEvents({
      orgId: "org-1",
      actorId: "00000000-0000-0000-0000-000000000001",
      actorType: ActorType.USER,
      minVersion: 3,
      from,
      to,
      sortOrder: "asc",
      limit: 5,
    });
    const args = findManyMock.mock.calls[0]![0];
    expect(args.where.actorId).toBe("00000000-0000-0000-0000-000000000001");
    expect(args.where.actorType).toBe("USER");
    expect(args.where.version).toEqual({ gte: 3 });
    expect(args.where.occurredAt).toEqual({ gte: from, lte: to });
    expect(args.orderBy).toEqual([{ occurredAt: "asc" }, { id: "asc" }]);
    expect(args.take).toBe(6); // limit + 1 for hasMore detection
  });

  it("defaults sortOrder to desc", async () => {
    await svc.queryEvents({ orgId: "org-1" });
    const args = findManyMock.mock.calls[0]![0];
    expect(args.orderBy).toEqual([{ occurredAt: "desc" }, { id: "desc" }]);
  });

  it("detects hasMore and returns nextCursor", async () => {
    findManyMock.mockResolvedValueOnce([
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ]);
    countMock.mockResolvedValueOnce(42);
    const result = await svc.queryEvents({ orgId: "org-1", limit: 2 });
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("b");
    expect(result.total).toBe(42);
  });
});

import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { redisClient } from "../../config/redis.js";
import { prisma } from "../../config/prisma.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

/**
 * GET /v1/presence
 *
 * Returns all currently online users in the caller's org. Reads the
 * `presence:{orgId}:{userId}` keys written by the presence handler
 * (`connection.handler.ts`, `presence.handler.ts`) and joins them with
 * user display data.
 *
 * Response shape matches PRD §7.2:
 *   { success: true, data: { onlineUsers: [...], count } }
 */
export const presenceRouter = Router();

interface RawPresence {
  userId: string;
  orgId: string;
  page?: string;
  lastSeen?: string;
}

presenceRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = (req as any).orgId as string;
      const onlineUsers = await listOnlineUsers(orgId);
      res.status(200).json({
        success: true,
        data: { onlineUsers, count: onlineUsers.length },
      });
    } catch (error) {
      next(error);
    }
  },
);

export async function listOnlineUsers(
  orgId: string,
): Promise<
  Array<{
    userId: string;
    name: string;
    avatarUrl: string | null;
    page: string;
    lastSeen: string;
  }>
> {
  // SCAN is the safe choice — KEYS blocks the Redis event loop. We cap
  // the iteration with a per-call safety bound in case of pathological
  // growth so a single request can't loop forever.
  const pattern = `presence:${orgId}:*`;
  const rawKeys: string[] = [];
  let cursor = "0";
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  do {
    const [next, keys] = await redisClient.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      200,
    );
    cursor = next;
    rawKeys.push(...keys);
    iterations += 1;
    if (iterations >= MAX_ITERATIONS) break;
  } while (cursor !== "0");

  if (rawKeys.length === 0) return [];

  const values = await redisClient.mget(rawKeys);
  const records: RawPresence[] = [];
  for (const v of values) {
    if (!v) continue;
    try {
      records.push(JSON.parse(v) as RawPresence);
    } catch {
      // ignore corrupt entries
    }
  }
  if (records.length === 0) return [];

  const userIds = records.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, orgId },
    select: { id: true, name: true, avatarUrl: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return records
    .map((r) => {
      const u = byId.get(r.userId);
      if (!u) return null;
      return {
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl ?? null,
        page: r.page ?? "",
        lastSeen: r.lastSeen ?? new Date(0).toISOString(),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

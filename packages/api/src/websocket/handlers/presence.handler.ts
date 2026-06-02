import type { Server, Socket } from "socket.io";
import { redisClient } from "../../config/redis.js";
import { getSocketUser } from "../socket.types.js";

/**
 * Register the `presence:heartbeat` handler.
 *
 * The client emits this every 30 seconds. The server refreshes the
 * presence key TTL in Redis (so stale entries self-expire if the
 * heartbeat stops) and broadcasts the user's current page to the org.
 */
export function registerPresenceHandlers(_io: Server, socket: Socket): void {
  const user = getSocketUser(socket);
  if (!user) return;

  socket.on(
    "presence:heartbeat",
    async (data: { page: string } | unknown) => {
      const page = isPagePayload(data) ? data.page : "";
      const lastSeen = new Date().toISOString();

      await redisClient.setex(
        `presence:${user.orgId}:${user.userId}`,
        300, // 5 min TTL; refreshed every 30s
        JSON.stringify({
          userId: user.userId,
          orgId: user.orgId,
          page,
          lastSeen,
        }),
      );

      socket.to(`org:${user.orgId}`).emit("presence:heartbeat", {
        userId: user.userId,
        page,
        lastSeen,
      });
    },
  );
}

function isPagePayload(v: unknown): v is { page: string } {
  return typeof v === "object" && v !== null && typeof (v as { page?: unknown }).page === "string";
}

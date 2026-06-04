import type { Server, Socket } from "socket.io";
import { redisClient } from "../../config/redis.js";
import { getSocketUser } from "../socket.types.js";
import { registerAnalyticsHandlers } from "../analytics.handler.js";
import { registerCollaborationHandlers } from "./collaboration.handler.js";
import { registerPresenceHandlers } from "./presence.handler.js";
import { registerRoomHandlers } from "./room.handler.js";
import { registerTypingHandlers } from "./typing.handler.js";

/**
 * Handle a freshly-authenticated socket connection.
 *
 * Responsibilities:
 *  - Join the per-org room (every org member sees org-scoped events).
 *  - Join the per-user room (targeted notifications).
 *  - Write the user's presence to Redis with a 5-minute TTL.
 *  - Broadcast a `presence:online` event to other org members.
 *  - Register the four other handler groups (room, presence, typing,
 *    collaboration).
 *  - On disconnect, clear presence and broadcast `presence:offline`.
 */
export async function handleConnection(io: Server, socket: Socket): Promise<void> {
  const user = getSocketUser(socket);
  if (!user) {
    // Should be impossible — the JWT middleware always sets this or rejects.
    socket.disconnect(true);
    return;
  }

  const { userId, orgId } = user;

  // 1. Join rooms.
  await socket.join(`org:${orgId}`);
  await socket.join(`user:${userId}`);

  // 2. Write presence to Redis (heartbeat refreshes this every 30s).
  const connectedAt = new Date().toISOString();
  await redisClient.setex(
    `presence:${orgId}:${userId}`,
    300,
    JSON.stringify({ userId, orgId, socketId: socket.id, connectedAt }),
  );

  // 3. Broadcast online status to the rest of the org.
  socket.to(`org:${orgId}`).emit("presence:online", { userId, orgId, connectedAt });

  // 4. Register domain handlers.
  registerRoomHandlers(io, socket);
  registerPresenceHandlers(io, socket);
  registerTypingHandlers(io, socket);
  registerCollaborationHandlers(io, socket);
  registerAnalyticsHandlers(io, socket);

  // 5. Cleanup on disconnect.
  socket.on("disconnect", async () => {
    await redisClient.del(`presence:${orgId}:${userId}`);
    socket.to(`org:${orgId}`).emit("presence:offline", { userId });
  });
}

import type { Server, Socket } from "socket.io";
import { prisma } from "../../config/prisma.js";
import { getSocketUser, type SocketUserData } from "../socket.types.js";

/**
 * Verify the socket's user has access to an entity-scoped room.
 *
 * Multi-tenant safety: a user in org A must not be able to join a
 * `task:xyz` room for a task that belongs to org B.
 */
async function verifyRoomAccess(
  user: SocketUserData,
  type: string,
  id: string,
): Promise<boolean> {
  switch (type) {
    case "workspace": {
      const ws = await prisma.workspace.findFirst({
        where: { id, orgId: user.orgId },
        select: { id: true },
      });
      return Boolean(ws);
    }
    case "project": {
      const proj = await prisma.project.findFirst({
        where: { id, orgId: user.orgId },
        select: { id: true },
      });
      return Boolean(proj);
    }
    case "task": {
      const task = await prisma.task.findFirst({
        where: { id, orgId: user.orgId },
        select: { id: true },
      });
      return Boolean(task);
    }
    default:
      return false;
  }
}

/**
 * Register `room:join` / `room:leave` handlers.
 *
 * The client emits these when navigating to a workspace / project / task
 * page, allowing the server to scope subsequent broadcasts (typing,
 * collaboration, comments) to the relevant subset of users.
 */
export function registerRoomHandlers(_io: Server, socket: Socket): void {
  const user = getSocketUser(socket);
  if (!user) return;

  socket.on("room:join", async (data: { type: string; id: string } | unknown) => {
    if (!isRoomRef(data)) {
      socket.emit("error", { message: "Invalid room:join payload" });
      return;
    }
    const roomKey = `${data.type}:${data.id}`;

    const hasAccess = await verifyRoomAccess(user, data.type, data.id);
    if (!hasAccess) {
      socket.emit("error", { message: "Access denied", room: roomKey });
      return;
    }

    await socket.join(roomKey);

    socket.to(roomKey).emit("room:user_joined", {
      userId: user.userId,
      room: roomKey,
    });

    // Tell the joiner who else is in the room.
    const socketsInRoom = await _io.in(roomKey).fetchSockets();
    const onlineUsers = socketsInRoom
      .map((s) => getSocketUser(s as unknown as Socket)?.userId)
      .filter((u): u is string => Boolean(u) && u !== user.userId);

    socket.emit("room:users", { room: roomKey, users: onlineUsers });
  });

  socket.on("room:leave", async (data: { type: string; id: string } | unknown) => {
    if (!isRoomRef(data)) return;
    const roomKey = `${data.type}:${data.id}`;
    await socket.leave(roomKey);
    socket.to(roomKey).emit("room:user_left", {
      userId: user.userId,
      room: roomKey,
    });
  });
}

function isRoomRef(v: unknown): v is { type: string; id: string } {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.type === "string" && typeof r.id === "string";
}

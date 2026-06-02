import type { Server, Socket } from "socket.io";
import { getSocketUser } from "../socket.types.js";

/**
 * Per-socket typing timers. Keyed by taskId so a user can be typing in
 * multiple comment boxes at once (rare, but cheap to support).
 */
const typingTimers = new WeakMap<Socket, Map<string, NodeJS.Timeout>>();

function getTimerMap(socket: Socket): Map<string, NodeJS.Timeout> {
  let m = typingTimers.get(socket);
  if (!m) {
    m = new Map();
    typingTimers.set(socket, m);
  }
  return m;
}

/**
 * Register `typing:start` / `typing:stop` handlers.
 *
 * A `typing:start` event is auto-reset after 3 seconds of silence — the
 * client doesn't need to send `typing:stop` explicitly, but can to be
 * precise (e.g. when the user clears the input).
 */
export function registerTypingHandlers(_io: Server, socket: Socket): void {
  const user = getSocketUser(socket);
  if (!user) return;
  const timers = getTimerMap(socket);

  socket.on("typing:start", (data: { taskId: string } | unknown) => {
    if (!isTaskRef(data)) return;
    const room = `task:${data.taskId}`;

    socket.to(room).emit("typing:start", {
      userId: user.userId,
      taskId: data.taskId,
    });

    // Reset any existing timer for this task on this socket.
    const existing = timers.get(data.taskId);
    if (existing) clearTimeout(existing);

    const t = setTimeout(() => {
      socket.to(room).emit("typing:stop", {
        userId: user.userId,
        taskId: data.taskId,
      });
      timers.delete(data.taskId);
    }, 3000);
    timers.set(data.taskId, t);
  });

  socket.on("typing:stop", (data: { taskId: string } | unknown) => {
    if (!isTaskRef(data)) return;
    socket.to(`task:${data.taskId}`).emit("typing:stop", {
      userId: user.userId,
      taskId: data.taskId,
    });
    const t = timers.get(data.taskId);
    if (t) {
      clearTimeout(t);
      timers.delete(data.taskId);
    }
  });

  socket.on("disconnect", () => {
    // The WeakMap entry will be GC'd, but we still need to clear pending
    // timeouts so they don't fire on a dead socket.
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
  });
}

function isTaskRef(v: unknown): v is { taskId: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { taskId?: unknown }).taskId === "string"
  );
}

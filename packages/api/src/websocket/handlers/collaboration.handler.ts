import type { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { prisma } from "../../config/prisma.js";
import { redisClient } from "../../config/redis.js";
import { getSocketUser } from "../socket.types.js";

/**
 * In-process registry of Yjs documents. Each entry is created lazily the
 * first time a user opens a task and lives until the process restarts.
 *
 * For multi-node deployments the Redis cache (`ydoc:task:{id}`) is the
 * source of truth for cold joins — see the `collaboration:sync` handler.
 * Active edits only need to converge within a single node.
 */
const documents = new Map<string, Y.Doc>();

/** Get or create a Y.Doc for a given task. */
function getOrCreateDoc(taskId: string): Y.Doc {
  let doc = documents.get(taskId);
  if (!doc) {
    doc = new Y.Doc();
    documents.set(taskId, doc);
  }
  return doc;
}

const UPDATE_MAX_BYTES = 64 * 1024;

/**
 * Register Yjs CRDT collaboration handlers.
 *
 *  - `collaboration:update`   — client sends a Yjs binary update
 *  - `collaboration:sync`     — client requests the full current state
 *  - `collaboration:awareness` — client shares cursor / user metadata
 */
export function registerCollaborationHandlers(_io: Server, socket: Socket): void {
  const user = getSocketUser(socket);
  if (!user) return;

  socket.on(
    "collaboration:update",
    async (data: { taskId: string; update: number[] | Uint8Array } | unknown) => {
      if (!isUpdatePayload(data)) return;

      // Multi-tenant gate: refuse updates for tasks outside this org.
      const task = await prisma.task.findFirst({
        where: { id: data.taskId, orgId: user.orgId },
        select: { id: true },
      });
      if (!task) return;

      const updateBytes = new Uint8Array(data.update);
      if (updateBytes.byteLength > UPDATE_MAX_BYTES) {
        // Refuse oversize updates — client should request a full sync.
        return;
      }

      const doc = getOrCreateDoc(data.taskId);
      Y.applyUpdate(doc, updateBytes);

      // Persist latest state to Redis (24h TTL) so new joiners can catch up.
      const state = Y.encodeStateAsUpdate(doc);
      await redisClient.set(
        `ydoc:task:${data.taskId}`,
        Buffer.from(state),
        "EX",
        86400,
      );

      // Relay the (small) update to other users in the same task room.
      socket.to(`task:${data.taskId}`).emit("collaboration:update", {
        taskId: data.taskId,
        update: Array.from(updateBytes),
      });
    },
  );

  socket.on("collaboration:sync", async (data: { taskId: string } | unknown) => {
    if (!isTaskRef(data)) return;

    const task = await prisma.task.findFirst({
      where: { id: data.taskId, orgId: user.orgId },
      select: { description: true },
    });
    if (!task) return;

    const cached = await redisClient.getBuffer(`ydoc:task:${data.taskId}`);
    if (cached) {
      socket.emit("collaboration:full_state", {
        taskId: data.taskId,
        state: Array.from(cached),
      });
      return;
    }

    // No cached state — seed a fresh Y.Doc from `task.description`.
    const doc = new Y.Doc();
    if (task.description) {
      doc.getText("content").insert(0, task.description);
    }
    const state = Y.encodeStateAsUpdate(doc);
    documents.set(data.taskId, doc);
    await redisClient.set(
      `ydoc:task:${data.taskId}`,
      Buffer.from(state),
      "EX",
      86400,
    );

    socket.emit("collaboration:full_state", {
      taskId: data.taskId,
      state: Array.from(state),
    });
  });

  socket.on(
    "collaboration:awareness",
    (data: { taskId: string; state: Record<string, unknown> } | unknown) => {
      if (!isAwarenessPayload(data)) return;
      socket.to(`task:${data.taskId}`).emit("collaboration:awareness", {
        userId: user.userId,
        taskId: data.taskId,
        state: data.state,
      });
    },
  );
}

function isTaskRef(v: unknown): v is { taskId: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { taskId?: unknown }).taskId === "string"
  );
}

function isUpdatePayload(
  v: unknown,
): v is { taskId: string; update: number[] | Uint8Array } {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  if (typeof r.taskId !== "string") return false;
  return Array.isArray(r.update) || r.update instanceof Uint8Array;
}

function isAwarenessPayload(
  v: unknown,
): v is { taskId: string; state: Record<string, unknown> } {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  if (typeof r.taskId !== "string") return false;
  return typeof r.state === "object" && r.state !== null;
}

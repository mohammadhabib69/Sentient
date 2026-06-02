import type { ActorType } from "@prisma/client";
import type { Server } from "socket.io";

/**
 * Real-time emit helpers, used by every CRUD service.
 *
 * Phase 5 calls into `emitToOrg` from a stub. Phase 6 routes those calls
 * through the live Socket.io server, which is set on `globalThis.__io` by
 * `initWebSocket()` at boot. The helpers are intentionally thin: just
 * forward to `io.to(room).emit(event, data)` so service code stays
 * readable.
 *
 * Multi-tenant safety: services MUST pass the user's `orgId` (or `userId`)
 * — the helpers only target the corresponding room. The JWT middleware
 * already prevents users from joining rooms for other orgs.
 */

type GlobalWithIO = typeof globalThis & { __io?: Server };

function getIO(): Server | undefined {
  return (globalThis as GlobalWithIO).__io;
}

/**
 * Phase 6 §5.3 envelope: every CRUD broadcast carries `actor` (who
 * caused the mutation) and `timestamp` (server clock at emit time) so
 * downstream consumers don't have to assume the actor identity. `payload`
 * is the original domain object passed by the caller.
 */
export interface BroadcastEnvelope {
  payload: unknown;
  actor: { id: string; type: ActorType };
  timestamp: string;
}

export interface EmitActor {
  id: string;
  type: ActorType;
}

/**
 * Wrap a domain payload in the standard envelope. Centralized so the
 * shape can evolve without touching every call site.
 */
export function envelope(payload: unknown, actor: EmitActor): BroadcastEnvelope {
  return {
    payload,
    actor: { id: actor.id, type: actor.type },
    timestamp: new Date().toISOString(),
  };
}

/** Emit to every socket in `org:{orgId}`. */
export function emitToOrg(
  orgId: string,
  event: string,
  data: unknown,
  actor?: EmitActor,
): void {
  const io = getIO();
  if (!io) return; // not booted yet (e.g. unit tests)
  const body = actor ? envelope(data, actor) : data;
  io.to(`org:${orgId}`).emit(event, body);
}

/** Emit to every socket in an arbitrary room key (e.g. `task:abc`). */
export function emitToRoom(
  roomKey: string,
  event: string,
  data: unknown,
): void {
  const io = getIO();
  if (!io) return;
  io.to(roomKey).emit(event, data);
}

/** Emit to the private `user:{userId}` room — used for targeted notifications. */
export function emitToUser(
  userId: string,
  event: string,
  data: unknown,
): void {
  const io = getIO();
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/** Emit to every socket in the org room EXCEPT the user who caused the event. */
export function emitToOrgExcept(
  orgId: string,
  excludeUserId: string,
  event: string,
  data: unknown,
): void {
  const io = getIO();
  if (!io) return;
  io.to(`org:${orgId}`).except(`user:${excludeUserId}`).emit(event, data);
}

import type { UserRole } from "@prisma/client";
import type { Server, Socket } from "socket.io";

/**
 * Authenticated user data attached to `socket.data` after the JWT
 * middleware has run. Available to every handler.
 */
export interface SocketUserData {
  userId: string;
  orgId: string;
  role: UserRole;
}

export type TypedServer = Server;
export type TypedSocket = Socket;

/**
 * Narrow `socket.data.user` to `SocketUserData | undefined`.
 *
 * Socket.io's `Socket.data` is `Record<string, any>` by default — we keep
 * it that way and add a typed accessor. Using a `declare module`
 * augmentation here would clash with the built-in `SocketData` interface.
 */
export function getSocketUser(socket: Socket): SocketUserData | undefined {
  return socket.data.user as SocketUserData | undefined;
}

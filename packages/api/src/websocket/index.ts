import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { env } from "../config/env.js";
import { redisClient } from "../config/redis.js";
import { tokenService } from "../services/token.service.js";
import { handleConnection } from "./handlers/connection.handler.js";
import type { SocketUserData } from "./socket.types.js";

/**
 * Initialise the Socket.io server and attach it to the shared HTTP server.
 *
 * Responsibilities:
 *  - Create a `Server` bound to the HTTP server (NOT a new port).
 *  - Plug in the Redis pub/sub adapter so we can scale to multiple Node
 *    processes later without changing the application code.
 *  - Run a JWT auth middleware on every handshake.
 *  - Expose the `io` instance to the rest of the app via `app.set("io", io)`
 *    and `globalThis.__io` (the latter is read by `websocket/events.ts`).
 *  - Register the connection handler.
 */
export function initWebSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    path: env.WS_PATH,
    cors: {
      origin: env.WS_CORS_ORIGIN,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Redis pub/sub adapter — required for multi-process scaling.
  // We duplicate the main client (one for pub, one for sub) per the
  // @socket.io/redis-adapter contract.
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // JWT auth middleware — runs before any connection event.
  io.use(async (socket: Socket, next) => {
    try {
      // Token can come from the explicit `auth` payload (preferred for the
      // browser) or the httpOnly `access_token` cookie (fallback for native
      // clients and same-origin tab refreshes).
      const authToken =
        typeof socket.handshake.auth?.token === "string"
          ? socket.handshake.auth.token
          : undefined;
      const cookieToken = socket.handshake.headers.cookie
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("access_token="))
        ?.split("=")[1];

      const token = authToken ?? cookieToken;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const payload = tokenService.verifyAccessToken(token);
      const userData: SocketUserData = {
        userId: payload.sub,
        orgId: payload.orgId,
        role: payload.role,
      };
      socket.data.user = userData;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });

  // Expose to the rest of the app. Two channels:
  //  - `app.set("io", io)` for typed access in route handlers.
  //  - `globalThis.__io` for service-layer / job worker access where the
  //    Express app object is not in scope.
  (globalThis as unknown as { __io?: Server }).__io = io;
  httpServer.on("close", () => {
    pubClient.disconnect();
    subClient.disconnect();
  });

  console.log(
    `[WS] Socket.io listening at ${env.WS_PATH} (cors=${env.WS_CORS_ORIGIN})`,
  );

  return io;
}

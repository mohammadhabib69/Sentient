import "dotenv/config";
import { createServer } from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { neo4jDriver } from "./config/neo4j.js";
import { prisma } from "./config/prisma.js";
import { redisClient } from "./config/redis.js";
import { v1Router } from "./routes/v1/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { initWebSocket } from "./websocket/index.js";
import {
  startMetricsBroadcaster,
  stopMetricsBroadcaster,
} from "./websocket/metrics.broadcaster.js";
import {
  startOutboxPoller,
  stopOutboxPoller,
  processOutboxBatch,
} from "./jobs/outbox.worker.js";

// Bull Board imports
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  emailQueue,
  aiQueue,
  webhookQueue,
  pdfQueue,
  graphSyncQueue,
  notificationQueue,
  billingQueue,
  sessionCleanupQueue,
} from "./jobs/queues.js";
import "./jobs/sessionCleanup.worker.js";
import "./jobs/graphSync.worker.js";
import "./jobs/ai.worker.js";

let server: ReturnType<typeof createServer> | null = null;

async function startServer(): Promise<void> {
  // 1) Import and run env validation
  void env;

  // 2) Connect PostgreSQL via Prisma
  await prisma.$connect();

  // 3) Connect Redis and run PING test
  await redisClient.ping();

  // 4) Connect Neo4j and run RETURN 1 test
  const neo4jSession = neo4jDriver.session();
  await neo4jSession.run("RETURN 1 as test");
  await neo4jSession.close();

  // Initialize Neo4j constraints
  const { initNeo4jConstraints } = await import("./config/neo4j.js");
  await initNeo4jConstraints();

  // Ensure the S3/MinIO bucket exists (no-op if S3_BUCKET is unset).
  const { ensureBucket } = await import("./config/s3.js");
  await ensureBucket();

  // 5) Initialize Express app
  const expressApp = app;

  // 6) Setup Bull Board
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(aiQueue),
      new BullMQAdapter(webhookQueue),
      new BullMQAdapter(pdfQueue),
      new BullMQAdapter(graphSyncQueue),
      new BullMQAdapter(notificationQueue),
      new BullMQAdapter(billingQueue),
      new BullMQAdapter(sessionCleanupQueue),
    ],
    serverAdapter: serverAdapter,
  });

  expressApp.use("/admin/queues", serverAdapter.getRouter());

  // Send a test job to email-queue for verification
  await emailQueue.add("test-job", { to: "test@example.com", subject: "Hello BullMQ" });

  // Schedule daily session cleanup job
  await sessionCleanupQueue.add(
    "cleanup",
    {},
    { repeat: { pattern: "0 3 * * *" }, jobId: "session-cleanup-daily" },
  );



  // 9) Create HTTP server, attach Socket.io, then start listening.
  //    We use `http.createServer(app)` so Socket.io can share the same port.
  const httpServer = createServer(expressApp);
  const io = initWebSocket(httpServer);
  expressApp.set("io", io);

  // 9a) Start the periodic metrics broadcaster (PRD §11) so dashboard
  //     cards update without a page refresh.
  startMetricsBroadcaster();

  // 9b) Start the outbox poller (Phase 7 §4). Drains pending outbox
  //     entries to Socket.io, Redis Stream, and CQRS projectors.
  startOutboxPoller();

  await new Promise<void>((resolve) => {
    server = httpServer.listen(env.PORT, () => {
      console.log(`API listening on port ${env.PORT}`);
      resolve();
    });
  });

  // 8) Register graceful shutdown (SIGTERM, SIGINT)
  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}, shutting down gracefully...`);

    stopMetricsBroadcaster();
    stopOutboxPoller();

    // Drain remaining outbox entries (Phase 7 §11) — best effort.
    try {
      console.log("[Shutdown] Draining outbox...");
      const result = await processOutboxBatch();
      console.log(
        `[Shutdown] Outbox drained: processed=${result.processed} errors=${result.errors}`,
      );
    } catch (err) {
      console.error("[Shutdown] outbox drain failed", err);
    }

    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error?: Error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    await prisma.$disconnect();
    await redisClient.quit();
    await neo4jDriver.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    void gracefulShutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void gracefulShutdown("SIGINT");
  });
}

startServer().catch(async (error: unknown) => {
  console.error("Failed to start API server:", error);
  await prisma.$disconnect().catch(() => undefined);
  await redisClient.quit().catch(() => undefined);
  await neo4jDriver.close().catch(() => undefined);
  process.exit(1);
});

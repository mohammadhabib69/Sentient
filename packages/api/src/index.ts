import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { neo4jDriver } from "./config/neo4j.js";
import { prisma } from "./config/prisma.js";
import { redisClient } from "./config/redis.js";
import { v1Router } from "./routes/v1/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

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

let server: ReturnType<typeof app.listen> | null = null;

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



  // 9) Start listening on PORT
  await new Promise<void>((resolve) => {
    server = expressApp.listen(env.PORT, () => {
      console.log(`API listening on port ${env.PORT}`);
      resolve();
    });
  });

  // 8) Register graceful shutdown (SIGTERM, SIGINT)
  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}, shutting down gracefully...`);

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

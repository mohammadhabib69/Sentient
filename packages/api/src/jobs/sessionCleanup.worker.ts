import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";
import { sessionService } from "../services/session.service.js";

export const sessionCleanupWorker = new Worker(
  "session-cleanup-queue",
  async () => {
    const count = await sessionService.cleanExpiredSessions();
    console.log(JSON.stringify({ event: "session_cleanup", deletedCount: count, timestamp: new Date().toISOString() }));
  },
  { connection: bullRedisClient },
);

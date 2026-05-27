import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";

export const graphSyncWorker = new Worker("graph-sync-queue", async () => {}, {
  connection: bullRedisClient,
});

import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";

export const webhookWorker = new Worker("webhook-queue", async () => {}, {
  connection: bullRedisClient,
});

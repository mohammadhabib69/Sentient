import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";

export const notificationWorker = new Worker("notification-queue", async () => {}, {
  connection: bullRedisClient,
});

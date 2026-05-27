import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";

export const emailWorker = new Worker("email-queue", async () => {}, {
  connection: bullRedisClient,
});

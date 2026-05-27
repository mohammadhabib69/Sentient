import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";

export const billingWorker = new Worker("billing-queue", async () => {}, {
  connection: bullRedisClient,
});

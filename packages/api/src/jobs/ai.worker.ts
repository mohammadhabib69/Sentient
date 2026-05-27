import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";

export const aiWorker = new Worker("ai-queue", async () => {}, { connection: bullRedisClient });

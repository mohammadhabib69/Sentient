import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";

export const pdfWorker = new Worker("pdf-queue", async () => {}, { connection: bullRedisClient });

import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { redisClient } from "../../config/redis.js";
import { neo4jDriver } from "../../config/neo4j.js";

type ServiceStatus = "ok" | "error";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const [postgres, redis, neo4j, pgvector, timescale] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkNeo4j(),
    checkPgvector(),
    checkTimescale(),
  ]);

  const services = { postgres, redis, neo4j, pgvector, timescale };
  const allOk = Object.values(services).every((status) => status === "ok");

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    uptime: process.uptime(),
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    services,
  });
});

async function checkPostgres(): Promise<ServiceStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  try {
    const result = await redisClient.ping();
    return result === "PONG" ? "ok" : "error";
  } catch {
    return "error";
  }
}

async function checkNeo4j(): Promise<ServiceStatus> {
  const session = neo4jDriver.session();
  try {
    await session.run("RETURN 1 as test");
    return "ok";
  } catch {
    return "error";
  } finally {
    await session.close();
  }
}

async function checkPgvector(): Promise<ServiceStatus> {
  try {
    const result = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    return result.length > 0 ? "ok" : "error";
  } catch {
    return "error";
  }
}

async function checkTimescale(): Promise<ServiceStatus> {
  try {
    const result = await prisma.$queryRaw<Array<{ hypertable_name: string }>>`
      SELECT hypertable_name
      FROM timescaledb_information.hypertables
      WHERE hypertable_name = 'events'
    `;
    return result.length > 0 ? "ok" : "error";
  } catch {
    return "error";
  }
}

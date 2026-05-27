import Redis from "ioredis";
import { env } from "./env.js";

type GlobalRedis = {
  redisClient?: Redis;
  bullRedisClient?: Redis;
};

const globalForRedis = globalThis as unknown as GlobalRedis;

function createRedisClient(url: string, name: string): Redis {
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  client.on("error", (err) => {
    console.error(`[redis:${name}] connection error`, err);
  });

  void client
    .ping()
    .then((res) => {
      if (res !== "PONG") {
        console.warn(`[redis:${name}] unexpected PING response: ${res}`);
      }
    })
    .catch((err) => {
      console.error(`[redis:${name}] PING failed`, err);
    });

  return client;
}

const redisUrl = env.REDIS_URL;

export const redisClient = globalForRedis.redisClient ?? createRedisClient(redisUrl, "default");

export const bullRedisClient =
  globalForRedis.bullRedisClient ?? createRedisClient(redisUrl, "bull");

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisClient = redisClient;
  globalForRedis.bullRedisClient = bullRedisClient;
}

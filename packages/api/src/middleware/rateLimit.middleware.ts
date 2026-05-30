import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    success: false,
    error: {
      message: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
    },
  },
});

/**
 * Rate limiter for registration endpoint
 * Requirements: 12.1 - 5 requests per hour per IP
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are incompatible with ioredis
    sendCommand: (...args: unknown[]) => redisClient.call(...(args as [string, ...string[]])),
    prefix: "rl:register:",
  }),
  message: {
    success: false,
    error: {
      message: "Too many registration attempts. Please try again later.",
      code: "RATE_LIMITED",
      statusCode: 429,
    },
  },
});

/**
 * Rate limiter for login endpoint
 * Requirements: 12.2 - 10 requests per 15 minutes per IP
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are incompatible with ioredis
    sendCommand: (...args: unknown[]) => redisClient.call(...(args as [string, ...string[]])),
    prefix: "rl:login:",
  }),
  message: {
    success: false,
    error: {
      message: "Too many login attempts. Please try again later.",
      code: "RATE_LIMITED",
      statusCode: 429,
    },
  },
});

/**
 * Rate limiter for forgot password endpoint
 * Requirements: 12.3 - 3 requests per hour per IP
 */
export const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are incompatible with ioredis
    sendCommand: (...args: unknown[]) => redisClient.call(...(args as [string, ...string[]])),
    prefix: "rl:forgot:",
  }),
  message: {
    success: false,
    error: {
      message: "Too many password reset requests. Please try again later.",
      code: "RATE_LIMITED",
      statusCode: 429,
    },
  },
});

/**
 * Rate limiter for email verification endpoint
 * Requirements: 12.4 - 3 requests per hour per user
 */
export const verificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are incompatible with ioredis
    sendCommand: (...args: unknown[]) => redisClient.call(...(args as [string, ...string[]])),
    prefix: "rl:verify:",
  }),
  keyGenerator: (req) => {
    // @ts-expect-error - req.user is added by auth middleware
    return req.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    error: {
      message: "Too many verification requests. Please try again later.",
      code: "RATE_LIMITED",
      statusCode: 429,
    },
  },
});

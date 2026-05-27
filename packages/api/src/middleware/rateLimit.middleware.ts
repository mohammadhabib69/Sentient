import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
    },
  },
});

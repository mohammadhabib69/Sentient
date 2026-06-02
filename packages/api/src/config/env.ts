import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEO4J_URI: z.string(),
  NEO4J_USER: z.string(),
  NEO4J_PASSWORD: z.string(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().url(),
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),
  /// Max upload size in megabytes. Defaults to 10 MB.
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  /// Comma-separated allow-list of MIME types for uploads.
  ALLOWED_FILE_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/webp,application/pdf,text/plain"),
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_CALLBACK_URL: z.string().url("GOOGLE_CALLBACK_URL must be a valid URL"),
  // Email configuration
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),
  // Frontend URLs for OAuth redirects and email links
  FRONTEND_DASHBOARD_URL: z.string().url("FRONTEND_DASHBOARD_URL must be a valid URL"),
  FRONTEND_LOGIN_URL: z.string().url("FRONTEND_LOGIN_URL must be a valid URL"),
  FRONTEND_VERIFY_EMAIL_URL: z.string().url("FRONTEND_VERIFY_EMAIL_URL must be a valid URL"),
  FRONTEND_RESET_PASSWORD_URL: z.string().url("FRONTEND_RESET_PASSWORD_URL must be a valid URL"),
  // WebSocket / Socket.io
  WS_CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  WS_PATH: z.string().default("/socket.io"),
  // Redis Streams (Reality Stream live feed)
  REDIS_STREAM_KEY: z.string().default("sentient:events:stream"),
  REDIS_STREAM_MAX_LEN: z.coerce.number().default(10000),
});

export const env = envSchema.parse(process.env);

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
});

export const env = envSchema.parse(process.env);

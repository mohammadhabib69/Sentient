import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it("should validate required environment variables", () => {
    const envSchema = z.object({
      DATABASE_URL: z.string().url(),
      REDIS_URL: z.string().url(),
      NEO4J_URI: z.string(),
      NEO4J_USER: z.string(),
      NEO4J_PASSWORD: z.string(),
      JWT_SECRET: z.string().min(32),
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
      GOOGLE_CLIENT_ID: z.string().optional(),
      GOOGLE_CLIENT_SECRET: z.string().optional(),
      GOOGLE_CALLBACK_URL: z.string().url().optional(),
      EMAIL_FROM: z.string().email().optional(),
      FRONTEND_DASHBOARD_URL: z.string().url().optional(),
      FRONTEND_LOGIN_URL: z.string().url().optional(),
    });

    const validEnv = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      REDIS_URL: "redis://localhost:6379",
      NEO4J_URI: "bolt://localhost:7687",
      NEO4J_USER: "neo4j",
      NEO4J_PASSWORD: "password",
      JWT_SECRET: "this-is-a-very-long-secret-key-with-at-least-32-characters",
      JWT_EXPIRES_IN: "15m",
      REFRESH_TOKEN_EXPIRES_IN: "30d",
      PORT: "3001",
      NODE_ENV: "development",
      FRONTEND_URL: "http://localhost:3000",
    };

    const result = envSchema.parse(validEnv);
    expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(result.JWT_SECRET).toBe(validEnv.JWT_SECRET);
    expect(result.PORT).toBe(3001);
  });

  it("should reject JWT_SECRET shorter than 32 characters", () => {
    const envSchema = z.object({
      JWT_SECRET: z.string().min(32),
    });

    expect(() => {
      envSchema.parse({ JWT_SECRET: "short-secret" });
    }).toThrow();
  });

  it("should validate Google OAuth URLs when provided", () => {
    const envSchema = z.object({
      GOOGLE_CALLBACK_URL: z.string().url().optional(),
    });

    const validUrl = envSchema.parse({
      GOOGLE_CALLBACK_URL: "http://localhost:3001/v1/auth/google/callback",
    });
    expect(validUrl.GOOGLE_CALLBACK_URL).toBe("http://localhost:3001/v1/auth/google/callback");

    expect(() => {
      envSchema.parse({ GOOGLE_CALLBACK_URL: "not-a-valid-url" });
    }).toThrow();
  });

  it("should validate email format for EMAIL_FROM", () => {
    const envSchema = z.object({
      EMAIL_FROM: z.string().email().optional(),
    });

    const validEmail = envSchema.parse({ EMAIL_FROM: "noreply@example.com" });
    expect(validEmail.EMAIL_FROM).toBe("noreply@example.com");

    expect(() => {
      envSchema.parse({ EMAIL_FROM: "not-an-email" });
    }).toThrow();
  });

  it("should apply default values for optional fields", () => {
    const envSchema = z.object({
      JWT_EXPIRES_IN: z.string().default("15m"),
      REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
      PORT: z.coerce.number().default(3001),
      NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    });

    const result = envSchema.parse({});
    expect(result.JWT_EXPIRES_IN).toBe("15m");
    expect(result.REFRESH_TOKEN_EXPIRES_IN).toBe("30d");
    expect(result.PORT).toBe(3001);
    expect(result.NODE_ENV).toBe("development");
  });

  it("should allow optional authentication fields to be undefined", () => {
    const envSchema = z.object({
      GOOGLE_CLIENT_ID: z.string().optional(),
      GOOGLE_CLIENT_SECRET: z.string().optional(),
      RESEND_API_KEY: z.string().optional(),
      EMAIL_FROM: z.string().email().optional(),
    });

    const result = envSchema.parse({});
    expect(result.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(result.GOOGLE_CLIENT_SECRET).toBeUndefined();
    expect(result.RESEND_API_KEY).toBeUndefined();
    expect(result.EMAIL_FROM).toBeUndefined();
  });
});

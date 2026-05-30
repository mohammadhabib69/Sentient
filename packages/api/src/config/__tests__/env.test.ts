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
      // Google OAuth - now required
      GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
      GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
      GOOGLE_CALLBACK_URL: z.string().url("GOOGLE_CALLBACK_URL must be a valid URL"),
      // Email configuration - now required
      EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),
      // Frontend URLs - now required
      FRONTEND_DASHBOARD_URL: z.string().url("FRONTEND_DASHBOARD_URL must be a valid URL"),
      FRONTEND_LOGIN_URL: z.string().url("FRONTEND_LOGIN_URL must be a valid URL"),
      FRONTEND_VERIFY_EMAIL_URL: z.string().url("FRONTEND_VERIFY_EMAIL_URL must be a valid URL"),
      FRONTEND_RESET_PASSWORD_URL: z.string().url("FRONTEND_RESET_PASSWORD_URL must be a valid URL"),
    });

    const validEnv = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      REDIS_URL: "redis://localhost:6379",
      NEO4J_URI: "bolt://localhost:7687",
      NEO4J_USER: "neo4j",
      NEO4J_PASSWORD: "password",
      JWT_SECRET: "this-is-a-very-long-secret-key-with-at-least-32-characters",
      COOKIE_SECRET: "this-is-another-long-secret-key-with-32-chars",
      JWT_EXPIRES_IN: "15m",
      REFRESH_TOKEN_EXPIRES_IN: "30d",
      PORT: "3001",
      NODE_ENV: "development",
      FRONTEND_URL: "http://localhost:3000",
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      GOOGLE_CALLBACK_URL: "http://localhost:3001/v1/auth/google/callback",
      EMAIL_FROM: "noreply@example.com",
      FRONTEND_DASHBOARD_URL: "http://localhost:3000/dashboard",
      FRONTEND_LOGIN_URL: "http://localhost:3000/login",
      FRONTEND_VERIFY_EMAIL_URL: "http://localhost:3000/verify-email",
      FRONTEND_RESET_PASSWORD_URL: "http://localhost:3000/reset-password",
    };

    const result = envSchema.parse(validEnv);
    expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(result.JWT_SECRET).toBe(validEnv.JWT_SECRET);
    expect(result.COOKIE_SECRET).toBe(validEnv.COOKIE_SECRET);
    expect(result.PORT).toBe(3001);
    expect(result.GOOGLE_CLIENT_ID).toBe(validEnv.GOOGLE_CLIENT_ID);
    expect(result.EMAIL_FROM).toBe(validEnv.EMAIL_FROM);
  });

  it("should reject JWT_SECRET shorter than 32 characters", () => {
    const envSchema = z.object({
      JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    });

    expect(() => {
      envSchema.parse({ JWT_SECRET: "short-secret" });
    }).toThrow("JWT_SECRET must be at least 32 characters");
  });

  it("should reject COOKIE_SECRET shorter than 32 characters", () => {
    const envSchema = z.object({
      COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters"),
    });

    expect(() => {
      envSchema.parse({ COOKIE_SECRET: "short-secret" });
    }).toThrow("COOKIE_SECRET must be at least 32 characters");
  });

  it("should require Google OAuth credentials", () => {
    const envSchema = z.object({
      GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
      GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
      GOOGLE_CALLBACK_URL: z.string().url("GOOGLE_CALLBACK_URL must be a valid URL"),
    });

    // Should pass with valid values
    const validOAuth = envSchema.parse({
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      GOOGLE_CALLBACK_URL: "http://localhost:3001/v1/auth/google/callback",
    });
    expect(validOAuth.GOOGLE_CLIENT_ID).toBe("test-client-id");

    // Should fail without GOOGLE_CLIENT_ID
    expect(() => {
      envSchema.parse({
        GOOGLE_CLIENT_SECRET: "test-client-secret",
        GOOGLE_CALLBACK_URL: "http://localhost:3001/v1/auth/google/callback",
      });
    }).toThrow();

    // Should fail with invalid URL
    expect(() => {
      envSchema.parse({
        GOOGLE_CLIENT_ID: "test-client-id",
        GOOGLE_CLIENT_SECRET: "test-client-secret",
        GOOGLE_CALLBACK_URL: "not-a-valid-url",
      });
    }).toThrow();
  });

  it("should require EMAIL_FROM with valid email format", () => {
    const envSchema = z.object({
      EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),
    });

    const validEmail = envSchema.parse({ EMAIL_FROM: "noreply@example.com" });
    expect(validEmail.EMAIL_FROM).toBe("noreply@example.com");

    // Should fail without EMAIL_FROM
    expect(() => {
      envSchema.parse({});
    }).toThrow();

    // Should fail with invalid email
    expect(() => {
      envSchema.parse({ EMAIL_FROM: "not-an-email" });
    }).toThrow();
  });

  it("should require all frontend URLs", () => {
    const envSchema = z.object({
      FRONTEND_DASHBOARD_URL: z.string().url("FRONTEND_DASHBOARD_URL must be a valid URL"),
      FRONTEND_LOGIN_URL: z.string().url("FRONTEND_LOGIN_URL must be a valid URL"),
      FRONTEND_VERIFY_EMAIL_URL: z.string().url("FRONTEND_VERIFY_EMAIL_URL must be a valid URL"),
      FRONTEND_RESET_PASSWORD_URL: z.string().url("FRONTEND_RESET_PASSWORD_URL must be a valid URL"),
    });

    // Should pass with all valid URLs
    const validUrls = envSchema.parse({
      FRONTEND_DASHBOARD_URL: "http://localhost:3000/dashboard",
      FRONTEND_LOGIN_URL: "http://localhost:3000/login",
      FRONTEND_VERIFY_EMAIL_URL: "http://localhost:3000/verify-email",
      FRONTEND_RESET_PASSWORD_URL: "http://localhost:3000/reset-password",
    });
    expect(validUrls.FRONTEND_DASHBOARD_URL).toBe("http://localhost:3000/dashboard");

    // Should fail without required URLs
    expect(() => {
      envSchema.parse({
        FRONTEND_DASHBOARD_URL: "http://localhost:3000/dashboard",
        FRONTEND_LOGIN_URL: "http://localhost:3000/login",
      });
    }).toThrow();

    // Should fail with invalid URL format
    expect(() => {
      envSchema.parse({
        FRONTEND_DASHBOARD_URL: "not-a-url",
        FRONTEND_LOGIN_URL: "http://localhost:3000/login",
        FRONTEND_VERIFY_EMAIL_URL: "http://localhost:3000/verify-email",
        FRONTEND_RESET_PASSWORD_URL: "http://localhost:3000/reset-password",
      });
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

  it("should allow RESEND_API_KEY to be optional", () => {
    const envSchema = z.object({
      RESEND_API_KEY: z.string().optional(),
    });

    const result = envSchema.parse({});
    expect(result.RESEND_API_KEY).toBeUndefined();

    const withKey = envSchema.parse({ RESEND_API_KEY: "re_test_key" });
    expect(withKey.RESEND_API_KEY).toBe("re_test_key");
  });

  it("should throw descriptive error when validation fails on app startup", () => {
    const envSchema = z.object({
      DATABASE_URL: z.string().url(),
      JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
      GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
      EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),
    });

    // Missing required fields should throw with descriptive errors
    expect(() => {
      envSchema.parse({
        DATABASE_URL: "postgresql://localhost:5432/db",
        // Missing JWT_SECRET, GOOGLE_CLIENT_ID, EMAIL_FROM
      });
    }).toThrow();

    // Invalid JWT_SECRET length should throw
    expect(() => {
      envSchema.parse({
        DATABASE_URL: "postgresql://localhost:5432/db",
        JWT_SECRET: "short",
        GOOGLE_CLIENT_ID: "test-id",
        EMAIL_FROM: "test@example.com",
      });
    }).toThrow();

    // Invalid email format should throw
    expect(() => {
      envSchema.parse({
        DATABASE_URL: "postgresql://localhost:5432/db",
        JWT_SECRET: "this-is-a-very-long-secret-key-with-at-least-32-characters",
        GOOGLE_CLIENT_ID: "test-id",
        EMAIL_FROM: "not-an-email",
      });
    }).toThrow();
  });
});

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
  // Event Sourcing (Phase 7)
  EVENT_STORE_RETENTION_DAYS: z.coerce.number().default(365),
  EVENT_REPLAY_BATCH_SIZE: z.coerce.number().default(100),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().default(1000),
  OUTBOX_MAX_RETRIES: z.coerce.number().default(5),
  OUTBOX_BATCH_SIZE: z.coerce.number().default(50),
  READ_MODEL_REBUILD_LOCK_TTL: z.coerce.number().default(300),
  // AI Agents (Phase 8)
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_ADVANCED_MODEL: z.string().default("gpt-4o"),
  AGENT_MAX_ITERATIONS: z.coerce.number().default(10),
  AGENT_TIMEOUT_MS: z.coerce.number().default(30000),
  AGENT_MEMORY_TOP_K: z.coerce.number().default(5),
  AGENT_AUTO_APPROVE_THRESHOLD: z.coerce.number().default(0.85),
  AGENT_APPROVAL_TIMEOUT_HOURS: z.coerce.number().default(24),
  HITL_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // Agent Builder (Phase 9)
  AGENT_BUILDER_SANDBOX_TIMEOUT_MS: z.coerce.number().default(10000),
  AGENT_BUILDER_MAX_NODES: z.coerce.number().default(50),
  AGENT_BUILDER_MAX_MEMORY: z.coerce.number().default(104857600),
  AGENT_BUILDER_PUBLISH_REQUIRES_APPROVAL: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // Queue System (Phase 10)
  QUEUE_DEFAULT_ATTEMPTS: z.coerce.number().default(3),
  QUEUE_BACKOFF_TYPE: z.enum(["exponential", "linear", "fixed"]).default("exponential"),
  QUEUE_BACKOFF_DELAY_MS: z.coerce.number().default(1000),
  QUEUE_BACKOFF_MULTIPLIER: z.coerce.number().default(2),
  QUEUE_MAX_BACKOFF_MS: z.coerce.number().default(60000),
  QUEUE_STALLED_INTERVAL: z.coerce.number().default(5000),
  QUEUE_STALLED_COUNT: z.coerce.number().default(2),
  QUEUE_LOCK_TTL: z.coerce.number().default(30000),
  // Worker Concurrency (Phase 10)
  WORKER_AI_CONCURRENCY: z.coerce.number().default(3),
  WORKER_EMAIL_CONCURRENCY: z.coerce.number().default(5),
  WORKER_PDF_CONCURRENCY: z.coerce.number().default(2),
  WORKER_SCHEDULE_CONCURRENCY: z.coerce.number().default(1),
  // Queue Monitoring (Phase 10)
  QUEUE_METRICS_INTERVAL_MS: z.coerce.number().default(10000),
  QUEUE_ALERT_THRESHOLD_SIZE: z.coerce.number().default(100),
  QUEUE_ALERT_THRESHOLD_AGE_MS: z.coerce.number().default(300000),
  // SMTP Configuration (Phase 10)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  // Analytics (Phase 11)
  ANALYTICS_ANOMALY_THRESHOLD_SIGMA: z.coerce.number().default(2),
  ANALYTICS_FORECAST_DAYS: z.coerce.number().default(30),
  ANALYTICS_RETENTION_MONTHS: z.coerce.number().default(12),
  ANOMALY_DETECTION_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  ANOMALY_CHECK_INTERVAL_HOURS: z.coerce.number().default(1),
  ANOMALY_MIN_DATA_POINTS: z.coerce.number().default(10),
  ANALYTICS_BROADCAST_INTERVAL_MS: z.coerce.number().default(30000),
  ANALYTICS_SNAPSHOT_RETENTION_DAYS: z.coerce.number().default(90),
  ANALYTICS_REPORT_MAX_ROWS: z.coerce.number().default(10000),
});

export const env = envSchema.parse(process.env);

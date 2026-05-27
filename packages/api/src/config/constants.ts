export const QUEUE_NAMES = {
  email: "email-queue",
  ai: "ai-queue",
  webhook: "webhook-queue",
  pdf: "pdf-queue",
  graphSync: "graph-sync-queue",
  notification: "notification-queue",
  billing: "billing-queue",
} as const;

export const REDIS_KEY_PATTERNS = {
  cache: "cache:{resource}:{id}",
  session: "session:{token_hash}",
  ratelimit: "ratelimit:{ip}:{window}",
  presence: "presence:{org_id}:{user_id}",
  bull: "bull:{queue_name}:",
} as const;

export const JWT_COOKIE_NAME = "sentient_token" as const;
export const API_VERSION = "v1" as const;

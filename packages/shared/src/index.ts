export const SENTIENT_PROJECT = {
  name: "Sentient",
  description: "AI-Native Business Reality Engine",
  phase: "Phase 0",
} as const;

export const AGENT_TYPES = ["operations", "finance", "customer", "dev", "custom"] as const;
export const USER_ROLES = ["super_admin", "org_admin", "manager", "member", "guest"] as const;
export const PLAN_TYPES = ["free", "pro", "business", "enterprise"] as const;

export type AgentType = (typeof AGENT_TYPES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type PlanType = (typeof PLAN_TYPES)[number];

export type ActorType = "user" | "agent" | "system";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<TData = unknown> {
  success: boolean;
  data: TData | null;
  error: ApiError | null;
  meta?: Record<string, unknown>;
}

export function ok<TData>(data: TData, meta?: Record<string, unknown>): ApiResponse<TData> {
  return {
    success: true,
    data,
    error: null,
    meta,
  };
}

export function fail(error: ApiError, meta?: Record<string, unknown>): ApiResponse<never> {
  return {
    success: false,
    data: null,
    error,
    meta,
  };
}

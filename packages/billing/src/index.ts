import type { PlanType } from "@sentient/shared";

export interface PlanLimit {
  plan: PlanType;
  agentLimit: number;
  monthlyActionLimit: number;
}

export const PLAN_LIMITS: PlanLimit[] = [
  { plan: "free", agentLimit: 1, monthlyActionLimit: 100 },
  { plan: "pro", agentLimit: 4, monthlyActionLimit: 2_500 },
  { plan: "business", agentLimit: 12, monthlyActionLimit: 25_000 },
  { plan: "enterprise", agentLimit: 100, monthlyActionLimit: 1_000_000 },
];

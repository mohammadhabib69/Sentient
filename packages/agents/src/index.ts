import type { AgentType } from "@sentient/shared";

export interface BuiltInAgent {
  name: string;
  type: AgentType;
  purpose: string;
}

export const BUILT_IN_AGENTS: BuiltInAgent[] = [
  {
    name: "Aria",
    type: "operations",
    purpose: "Task monitoring, reassignment, and deadline prediction.",
  },
  {
    name: "Nova",
    type: "finance",
    purpose: "Invoice tracking, anomaly detection, and payment forecasting.",
  },
  {
    name: "Echo",
    type: "customer",
    purpose: "Communication analysis, sentiment scoring, and escalation.",
  },
  {
    name: "Flux",
    type: "dev",
    purpose: "GitHub integration, bug prioritization, and deployment suggestions.",
  },
];

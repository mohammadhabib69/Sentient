import { Agent, AgentAction } from "@/types/agent.types";

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agt_1",
    name: "Aria",
    type: "operations",
    isActive: true,
    approvalMode: "auto_low_risk",
    actionsCount: 1420,
    config: { model: "gpt-4o", system: "Data operations and task routing." },
  },
  {
    id: "agt_2",
    name: "Nova",
    type: "finance",
    isActive: true,
    approvalMode: "always",
    actionsCount: 384,
    config: { model: "gpt-4o", system: "Financial reconciliation and alerting." },
  },
  {
    id: "agt_3",
    name: "Echo",
    type: "customer",
    isActive: false,
    approvalMode: "never",
    actionsCount: 0,
    config: { model: "claude-3.5-sonnet", system: "Customer support draft replies." },
  },
  {
    id: "agt_4",
    name: "Flux",
    type: "dev",
    isActive: true,
    approvalMode: "auto_low_risk",
    actionsCount: 8900,
    config: { model: "gpt-4o", system: "Code review and PR generation." },
  },
];

export const MOCK_PENDING_ACTIONS: AgentAction[] = [
  {
    id: "act_1",
    agentId: "agt_4",
    agentName: "Flux",
    actionType: "Create Pull Request",
    description: "Merge automated dependency updates (14 packages).",
    payload: { targetBranch: "main", filesChanged: 3 },
    status: "pending",
    riskLevel: "medium",
    expiresAt: new Date(Date.now() + 1000 * 60 * 23).toISOString(), // 23 mins
    createdAt: new Date().toISOString(),
  },
  {
    id: "act_2",
    agentId: "agt_2",
    agentName: "Nova",
    actionType: "Execute Refund",
    description: "Refund invoice INV-2039 for customer Acme Corp.",
    payload: { amount: 450.0, currency: "USD" },
    status: "pending",
    riskLevel: "high",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4 hours
    createdAt: new Date().toISOString(),
  },
  {
    id: "act_3",
    agentId: "agt_1",
    agentName: "Aria",
    actionType: "Reassign Task",
    description: "Reassign 5 stalled tasks from Alex to Sarah.",
    payload: { taskIds: [1, 2, 3, 4, 5], newAssignee: "usr_2" },
    status: "pending",
    riskLevel: "low",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours
    createdAt: new Date().toISOString(),
  },
];

export type AgentType = "operations" | "finance" | "customer" | "dev" | "custom";
export type ActionStatus = "pending" | "approved" | "rejected" | "executed" | "failed";
export type ApprovalMode = "always" | "auto_low_risk" | "never";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  isActive: boolean;
  approvalMode: ApprovalMode;
  actionsCount: number;
  config: Record<string, unknown>;
}

export interface AgentAction {
  id: string;
  agentId: string;
  agentName: string;
  actionType: string;
  description: string;
  payload: Record<string, unknown>;
  status: ActionStatus;
  riskLevel: "low" | "medium" | "high";
  expiresAt: string;
  createdAt: string;
}

// ─── Custom Agent Builder Types (Phase 9) ──────────────────────────

export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface CustomAgent {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  isActive: boolean;
  version: number;
  flowDefinition: FlowDefinition;
  compiledCode?: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SandboxTestResult {
  executionId: string;
  success: boolean;
  output: unknown;
  durationMs: number;
  error: string | null;
}

export type AgentType    = 'operations' | 'finance' | 'customer' | 'dev' | 'custom'
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'
export type ApprovalMode = 'always' | 'auto_low_risk' | 'never'

export interface Agent {
  id: string
  name: string
  type: AgentType
  isActive: boolean
  approvalMode: ApprovalMode
  actionsCount: number
  config: Record<string, unknown>
}

export interface AgentAction {
  id: string
  agentId: string
  agentName: string
  actionType: string
  description: string
  payload: Record<string, unknown>
  status: ActionStatus
  riskLevel: 'low' | 'medium' | 'high'
  expiresAt: string
  createdAt: string
}

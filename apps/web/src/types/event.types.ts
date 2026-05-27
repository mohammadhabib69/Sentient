export type ActorType = 'user' | 'agent' | 'system'

export type StreamEventVariant = 'suggestion' | 'anomaly' | 'approval' | 'critical' | 'system'

export interface StreamEventDisplay {
  variant: StreamEventVariant
  badge: string
  description: string
  resourceLabel: string
  actionLabel: string
  initials?: string
}

export interface StreamEvent {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  payload: Record<string, unknown>
  actor: { id: string; name: string; type: ActorType; avatarUrl?: string }
  occurredAt: string
  display?: StreamEventDisplay
}

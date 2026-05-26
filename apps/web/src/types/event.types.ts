export type ActorType = 'user' | 'agent' | 'system'

export interface StreamEvent {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  payload: Record<string, unknown>
  actor: { id: string; name: string; type: ActorType; avatarUrl?: string }
  occurredAt: string
}

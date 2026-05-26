import { StreamEvent } from '@/types/event.types'

// Generate 30 realistic events across users, agents, and system
export const MOCK_EVENTS: StreamEvent[] = Array.from({ length: 30 }).map((_, i) => {
  const isAgent = i % 3 === 0
  const isSystem = i % 7 === 0
  const isError = i === 5

  let type = 'task_completed'
  let payload: Record<string, unknown> = { taskId: `task_${i}`, duration: 120 }
  let actor: StreamEvent['actor'] = { id: 'usr_1', name: 'Mohammad Habib', type: 'user', avatarUrl: '/avatars/user.png' }

  if (isAgent) {
    type = 'agent_action_executed'
    payload = { actionId: `act_${i}`, result: 'success' }
    actor = { id: 'agt_4', name: 'Flux', type: 'agent' }
  } else if (isSystem) {
    type = 'deployment_finished'
    payload = { version: 'v1.4.2' }
    actor = { id: 'sys_1', name: 'System', type: 'system' }
  }

  if (isError) {
    type = 'webhook_failed'
    payload = { endpoint: 'https://api.acme.corp/webhook', statusCode: 502 }
    actor = { id: 'sys_1', name: 'System', type: 'system' }
  }

  return {
    id: `evt_${i}`,
    type,
    aggregateId: `agg_${i % 5}`,
    aggregateType: isAgent ? 'agent' : 'project',
    payload,
    actor,
    occurredAt: new Date(Date.now() - 1000 * 60 * 15 * i).toISOString(),
  }
})

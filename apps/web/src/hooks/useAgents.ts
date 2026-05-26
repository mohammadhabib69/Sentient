import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Agent, AgentAction } from '@/types/agent.types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async (): Promise<Agent[]> => {
      const res = await fetch(`${API_URL}/agents`)
      const json = (await res.json()) as ApiResponse<Agent[]>
      if (!json.success) throw new Error(json.error || 'Failed to fetch agents')
      return json.data
    },
    staleTime: 30000,
  })
}

export function usePendingActions() {
  return useQuery({
    queryKey: ['agent-actions', 'pending'],
    queryFn: async (): Promise<AgentAction[]> => {
      const res = await fetch(`${API_URL}/agents/actions?status=pending`)
      const json = (await res.json()) as ApiResponse<AgentAction[]>
      if (!json.success) throw new Error(json.error || 'Failed to fetch pending actions')
      return json.data
    },
    staleTime: 10000,
  })
}

export function useApproveAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (actionId: string) => {
      const res = await fetch(`${API_URL}/agents/actions/${actionId}/approve`, {
        method: 'POST',
      })
      const json = (await res.json()) as ApiResponse<{ id: string; status: string }>
      if (!json.success) throw new Error(json.error || 'Failed to approve action')
      return json.data
    },
    onSuccess: () => {
      // Invalidate to refresh the pending list
      queryClient.invalidateQueries({ queryKey: ['agent-actions', 'pending'] })
    },
  })
}

export function useRejectAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (actionId: string) => {
      const res = await fetch(`${API_URL}/agents/actions/${actionId}/reject`, {
        method: 'POST',
      })
      const json = (await res.json()) as ApiResponse<{ id: string; status: string }>
      if (!json.success) throw new Error(json.error || 'Failed to reject action')
      return json.data
    },
    onSuccess: () => {
      // Invalidate to refresh the pending list
      queryClient.invalidateQueries({ queryKey: ['agent-actions', 'pending'] })
    },
  })
}

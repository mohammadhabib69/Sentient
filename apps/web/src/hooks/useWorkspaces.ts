import { useQuery, useMutation } from '@tanstack/react-query'

export function useWorkspaces() { return useQuery({ queryKey: ['workspaces'], queryFn: async () => [] }) }
export function useWorkspace(id: string) { return useQuery({ queryKey: ['workspaces', id], queryFn: async () => null }) }
export function useCreateWorkspace() { return useMutation({ mutationFn: async () => null }) }
export function useUpdateWorkspace() { return useMutation({ mutationFn: async () => null }) }

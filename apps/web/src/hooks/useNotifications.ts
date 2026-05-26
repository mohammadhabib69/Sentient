import { useQuery, useMutation } from '@tanstack/react-query'

export function useNotifications() { return useQuery({ queryKey: ['notifications'], queryFn: async () => [] }) }
export function useMarkRead() { return useMutation({ mutationFn: async () => null }) }
export function useMarkAllRead() { return useMutation({ mutationFn: async () => null }) }

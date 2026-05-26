import { useQuery, useMutation } from '@tanstack/react-query'

export function useCurrentUser() {
  return useQuery({ queryKey: ['auth', 'user'], queryFn: async () => null })
}
export function useLogin() { return useMutation({ mutationFn: async () => null }) }
export function useRegister() { return useMutation({ mutationFn: async () => null }) }
export function useLogout() { return useMutation({ mutationFn: async () => null }) }

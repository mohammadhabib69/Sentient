import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Organization } from '@/types/organization.types'

interface AuthState {
  user: User | null
  org: Organization | null
  accessToken: string | null
  setAuth: (user: User, org: Organization, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      org: null,
      accessToken: null,
      setAuth: (user, org, token) => set({ user, org, accessToken: token }),
      clearAuth: () => set({ user: null, org: null, accessToken: null }),
    }),
    {
      name: 'sentient-auth',
    }
  )
)

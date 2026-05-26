export type Plan = 'free' | 'pro' | 'business' | 'enterprise'
export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'member' | 'guest'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: Plan
  settings: Record<string, unknown>
  createdAt: string
}

export interface User {
  id: string
  orgId: string
  email: string
  name: string
  avatarUrl: string | null
  role: UserRole
  lastActiveAt: string
}

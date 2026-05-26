import { User } from '@/types/organization.types'

// Mock current date for realistic lastActiveAt
const now = new Date().toISOString()

export const MOCK_USERS: User[] = [
  {
    id: 'usr_1',
    orgId: 'org_1',
    email: 'mohammad.habib@sentient.ai',
    name: 'Mohammad Habib',
    avatarUrl: '/avatars/user.png',
    role: 'super_admin',
    lastActiveAt: now,
  },
  {
    id: 'usr_2',
    orgId: 'org_1',
    email: 'sarah.j@acme.corp',
    name: 'Sarah Jenkins',
    avatarUrl: null,
    role: 'org_admin',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'usr_3',
    orgId: 'org_1',
    email: 'alex.p@acme.corp',
    name: 'Alex Patel',
    avatarUrl: null,
    role: 'manager',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'usr_4',
    orgId: 'org_1',
    email: 'chen.w@acme.corp',
    name: 'Chen Wei',
    avatarUrl: null,
    role: 'member',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'usr_5',
    orgId: 'org_1',
    email: 'emily.r@acme.corp',
    name: 'Emily Ross',
    avatarUrl: null,
    role: 'member',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

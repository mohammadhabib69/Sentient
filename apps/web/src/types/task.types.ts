import { User } from './organization.types'

export type TaskStatus   = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  projectId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee: User | null
  agentAssigned: boolean
  dueDate: string | null
  estimatedHours: number | null
  position: number
  createdAt: string
  updatedAt: string
}

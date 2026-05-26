import { create } from 'zustand'
import { Task } from '@/types/task.types'

interface TaskState {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  moveTask: (taskId: string, newStatus: Task['status'], newPosition: number) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),
  moveTask: (taskId, newStatus, newPosition) =>
    set((state) => {
      const newTasks = state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
      )
      return { tasks: newTasks }
    }),
}))

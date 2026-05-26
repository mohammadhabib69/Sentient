import { useQuery } from '@tanstack/react-query'

export function useTasks(projectId?: string) { 
  return useQuery({ 
    queryKey: ['tasks', projectId], 
    queryFn: async () => {
       const { MOCK_TASKS } = await import('@/mocks/fixtures/tasks.fixture')
       return projectId ? MOCK_TASKS.filter(t => t.projectId === projectId) : MOCK_TASKS
    } 
  }) 
}

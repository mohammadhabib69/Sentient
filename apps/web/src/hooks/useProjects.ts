import { useQuery } from '@tanstack/react-query'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'

export function useProjects(workspaceId?: string) { 
  return useQuery({ 
    queryKey: ['projects', workspaceId], 
    queryFn: async () => {
       // Just returning the MOCK_PROJECTS directly for the sake of the dashboard
       const { MOCK_PROJECTS } = await import('@/mocks/fixtures/projects.fixture')
       return MOCK_PROJECTS
    } 
  }) 
}

import { useQuery } from '@tanstack/react-query'

export function useAnalyticsOverview() { 
  return useQuery({ 
    queryKey: ['analytics', 'overview'], 
    queryFn: async () => {
       const { MOCK_HEALTH_METRICS } = await import('@/mocks/fixtures/analytics.fixture')
       return MOCK_HEALTH_METRICS
    } 
  }) 
}

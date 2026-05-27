import { useQuery } from "@tanstack/react-query";

export function useStreamEvents(filters?: any) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async () => {
      const { MOCK_EVENTS } = await import("@/mocks/fixtures/events.fixture");
      return MOCK_EVENTS;
    },
  });
}

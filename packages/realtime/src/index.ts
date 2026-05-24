export const REALTIME_EVENTS = [
  "task.updated",
  "agent.action.pending",
  "agent.action.executed",
  "user.presence",
  "notification.new",
  "graph.updated",
  "join",
] as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[number];

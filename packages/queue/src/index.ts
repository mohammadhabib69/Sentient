export const QUEUE_NAMES = {
  notifications: "notifications",
  agentActions: "agent-actions",
  webhooks: "webhooks",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

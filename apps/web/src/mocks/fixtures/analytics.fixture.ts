// 30 days of mock velocity data
export const MOCK_VELOCITY_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(Date.now() - 1000 * 60 * 60 * 24 * (29 - i)).toISOString().split("T")[0],
  completedTasks: Math.floor(Math.random() * 20) + 5,
  agentAutomated: Math.floor(Math.random() * 15) + 2,
}));

export const MOCK_AGENT_BREAKDOWN = [
  { agent: "Aria", operations: 1420, errors: 12 },
  { agent: "Nova", finance: 384, errors: 0 },
  { agent: "Flux", dev: 8900, errors: 45 },
];

export const MOCK_HEATMAP_DATA = Array.from({ length: 90 }).map((_, i) => ({
  date: new Date(Date.now() - 1000 * 60 * 60 * 24 * (89 - i)).toISOString().split("T")[0],
  value: Math.floor(Math.random() * 100),
}));

export const MOCK_HEALTH_METRICS = {
  activeProjects: 4,
  tasksBlocked: 3,
  systemUptime: 99.98,
  agentSuccessRate: 98.5,
};

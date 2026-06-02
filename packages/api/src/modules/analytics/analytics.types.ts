export interface OrgOverviewMetrics {
  activeTasks: number;
  completedTasksToday: number;
  pendingApprovals: number;
  agentActionsToday: number;
  onlineUsers: number;
  healthScore: number;
}

export interface TaskVelocityPoint {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
  tasksBlocked: number;
}

export interface AgentPerformancePoint {
  date: string;
  agentId: string;
  agentType: string;
  actionsCreated: number;
  actionsExecuted: number;
  actionsFailed: number;
  actionsRejected: number;
  successRate: number;
}

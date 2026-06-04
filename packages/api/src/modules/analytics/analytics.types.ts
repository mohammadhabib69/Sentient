// Phase 7 — read-model shapes (still served by /v1/analytics/overview etc.)
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

// ─── Phase 11 — Analytics + BI Dashboard ──────────────────────

export type AlertSeverity = "info" | "warning" | "critical";
export type RiskImpact = "low" | "medium" | "high";
export type TeamMorale = "excellent" | "good" | "fair" | "poor";
export type AnomalySeverity = "low" | "warning" | "critical";
export type Trend = "up" | "down" | "stable";
export type AgentTrend = "improving" | "declining" | "stable";
export type ReportStatus = "pending" | "completed" | "failed";
export type ForecastModel = "linear" | "exponential" | "polynomial";
export type ForecastEntityType = "project" | "agent" | "team";

export interface OverviewAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionUrl?: string;
}

export interface OverviewRisk {
  title: string;
  probability: number;
  impact: RiskImpact;
}

export interface OverviewMetrics {
  activeTasks: number;
  completedTasksThisWeek: number;
  completionVelocity: number;
  projectHealth: number;
  teamMorale: TeamMorale;
  agentEfficiency: number;
  systemUptime: number;
  alerts: OverviewAlert[];
  topRisks: OverviewRisk[];
}

export interface VelocityDay {
  date: string;
  created: number;
  completed: number;
  inProgress: number;
  blocked: number;
}

export interface ProjectionPoint {
  date: string;
  tasks: number;
}

export interface VelocityMetrics {
  dailyData: VelocityDay[];
  weeklyAverage: number;
  trend: Trend;
  cycleTime: number;
  throughput: number;
  forecast: ProjectionPoint[];
}

export interface AgentCommonError {
  error: string;
  count: number;
}

export interface AgentStat {
  agentId: string;
  agentName: string;
  agentType: string;
  totalActions: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgExecutionMs: number;
  commonErrors: AgentCommonError[];
  lastActionAt: string | null;
  trend: AgentTrend;
}

export interface AgentMetrics {
  agents: AgentStat[];
  overallSuccessRate: number;
  totalExecutions: number;
  errorDistribution: Record<string, number>;
}

export interface ProjectHealth {
  id: string;
  name: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTaskCount: number;
  healthScore: number;
  dueDate: string | null;
}

export interface ProjectHealthMetrics {
  projects: ProjectHealth[];
  avgHealth: number;
  totalProjects: number;
  activeProjects: number;
  overdueProjects: number;
  blockedTasks: number;
}

export interface AnomalyExpectedRange {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

export interface AnomalyResult {
  metric: string;
  isAnomaly: boolean;
  severity: AnomalySeverity;
  value: number;
  expected: AnomalyExpectedRange;
  deviations: number;
  description: string;
}

export interface DetectedAnomalyRecord {
  id: string;
  metric: string;
  severity: AnomalySeverity;
  description: string;
  value: number;
  expected: AnomalyExpectedRange;
  deviations: number;
  detectedAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  confidence: number;
}

export interface ForecastRecord {
  id: string;
  entityType: ForecastEntityType;
  entityId: string;
  metric: string;
  model: ForecastModel;
  accuracy: number;
  predictions: ForecastPoint[];
  generatedAt: string;
  expiresAt: string;
}

export interface SnapshotRecord {
  id: string;
  name: string;
  description: string | null;
  snapshotData: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export interface CustomReportInput {
  name: string;
  description?: string;
  metrics: string[];
  filters?: Record<string, unknown>;
  isScheduled?: boolean;
  scheduleExpr?: string;
}

export interface CustomReportRecord {
  id: string;
  name: string;
  description: string | null;
  metrics: string[];
  filters: Record<string, unknown>;
  isScheduled: boolean;
  scheduleExpr: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportExecutionRecord {
  id: string;
  reportId: string;
  status: ReportStatus;
  output: Record<string, unknown> | null;
  fileUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface QueueInsight {
  name: string;
  waiting: number;
  active: number;
  failed: number;
  delayed: number;
  health: "healthy" | "warning" | "critical";
}

export interface AdminInsights {
  queues: QueueInsight[];
  totalDeadLetters: number;
  activeAgents: number;
  agentsWithFailures: number;
  totalSnapshots: number;
  pendingAnomalies: number;
  scheduledReports: number;
}

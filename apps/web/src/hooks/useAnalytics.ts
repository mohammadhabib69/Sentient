"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * Phase 11 — Analytics hooks.
 *
 * Mirrors the queue monitoring hook pattern: raw `fetch` with
 * `credentials: "include"` for cookie-based auth, response envelope
 * `{ success, data, error? }`, and a `refetchInterval` per query to
 * keep the cards live even if the socket dies.
 *
 * Real-time updates ride on `useAnalyticsSocket()` — those handlers
 * invalidate the matching query keys so the cards refresh in place.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

// ─── Types (mirror the API responses) ─────────────────────────

export interface OverviewAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  actionUrl?: string;
}

export interface OverviewRisk {
  title: string;
  probability: number;
  impact: "low" | "medium" | "high";
}

export interface OverviewMetrics {
  activeTasks: number;
  completedTasksThisWeek: number;
  completionVelocity: number;
  projectHealth: number;
  teamMorale: "excellent" | "good" | "fair" | "poor";
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
  trend: "up" | "down" | "stable";
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
  trend: "improving" | "declining" | "stable";
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

export interface DetectedAnomaly {
  id: string;
  metric: string;
  severity: "low" | "warning" | "critical";
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
  entityType: "project" | "agent" | "team";
  entityId: string;
  metric: string;
  model: "linear" | "exponential" | "polynomial";
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
  status: "pending" | "completed" | "failed";
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

// ─── Query keys (so socket-driven invalidation stays consistent) ─

export const analyticsKeys = {
  overview: () => ["analytics", "overview"] as const,
  velocity: (days: number) => ["analytics", "velocity", days] as const,
  agents: (days: number) => ["analytics", "agents", days] as const,
  projects: (limit: number) => ["analytics", "projects", limit] as const,
  anomalies: (severity?: string) =>
    ["analytics", "anomalies", severity ?? "all"] as const,
  forecasts: (entityType?: string, entityId?: string, metric?: string) =>
    [
      "analytics",
      "forecasts",
      entityType ?? "all",
      entityId ?? "all",
      metric ?? "all",
    ] as const,
  snapshots: (limit: number) => ["analytics", "snapshots", limit] as const,
  reports: () => ["analytics", "reports"] as const,
  reportExecutions: (reportId: string) =>
    ["analytics", "reports", reportId, "executions"] as const,
  admin: () => ["analytics", "admin"] as const,
};

// ─── Read hooks ───────────────────────────────────────────────

export function useOverview(
  options?: Partial<UseQueryOptions<OverviewMetrics>>,
) {
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: () => get<OverviewMetrics>("/analytics/overview-full"),
    refetchInterval: 30_000,
    staleTime: 10_000,
    ...options,
  });
}

export function useVelocity(days = 30) {
  return useQuery({
    queryKey: analyticsKeys.velocity(days),
    queryFn: () =>
      get<VelocityMetrics>(`/analytics/velocity?days=${days}`),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useAgents(days = 30) {
  return useQuery({
    queryKey: analyticsKeys.agents(days),
    queryFn: () => get<AgentMetrics>(`/analytics/agents?days=${days}`),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useProjects(limit = 20) {
  return useQuery({
    queryKey: analyticsKeys.projects(limit),
    queryFn: () =>
      get<ProjectHealthMetrics>(`/analytics/projects?limit=${limit}`),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useAnomalies(severity?: "low" | "warning" | "critical") {
  return useQuery({
    queryKey: analyticsKeys.anomalies(severity),
    queryFn: () => {
      const qs = severity ? `?severity=${severity}` : "";
      return get<DetectedAnomaly[]>(`/analytics/anomalies${qs}`);
    },
    refetchInterval: 60_000,
    staleTime: 20_000,
  });
}

export function useForecasts(opts: {
  entityType?: "project" | "agent" | "team";
  entityId?: string;
  metric?: string;
} = {}) {
  return useQuery({
    queryKey: analyticsKeys.forecasts(
      opts.entityType,
      opts.entityId,
      opts.metric,
    ),
    queryFn: () => get<ForecastRecord[]>("/analytics/forecasts"),
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
}

export function useSnapshots(limit = 20) {
  return useQuery({
    queryKey: analyticsKeys.snapshots(limit),
    queryFn: () => get<SnapshotRecord[]>(`/analytics/snapshots?limit=${limit}`),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useReports() {
  return useQuery({
    queryKey: analyticsKeys.reports(),
    queryFn: () => get<CustomReportRecord[]>("/analytics/reports"),
    staleTime: 30_000,
  });
}

export function useReportExecutions(reportId: string) {
  return useQuery({
    queryKey: analyticsKeys.reportExecutions(reportId),
    queryFn: () => get<ReportExecutionRecord[]>(`/analytics/reports/${reportId}/executions`),
    enabled: !!reportId,
  });
}

export function useAdminInsights() {
  return useQuery({
    queryKey: analyticsKeys.admin(),
    queryFn: () => get<AdminInsights>("/analytics/admin/insights"),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useAcknowledgeAnomaly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post<DetectedAnomaly>(`/analytics/anomalies/${id}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "anomalies"] });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.overview() });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.admin() });
    },
  });
}

export function useRefreshAnomalies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post<{ results: unknown[] }>("/analytics/anomalies/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "anomalies"] });
    },
  });
}

export function useRefreshForecasts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post<{ total: number }>("/analytics/forecasts/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "forecasts"] });
    },
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description?: string;
      snapshotData?: Record<string, unknown>;
    }) => post<SnapshotRecord>("/analytics/snapshots", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "snapshots"] });
    },
  });
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<unknown>(`/analytics/snapshots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "snapshots"] });
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description?: string;
      metrics: string[];
      filters?: Record<string, unknown>;
      isScheduled?: boolean;
      scheduleExpr?: string;
    }) => post<CustomReportRecord>("/analytics/reports", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: Partial<{
        name: string;
        description: string;
        metrics: string[];
        filters: Record<string, unknown>;
        isScheduled: boolean;
        scheduleExpr: string;
      }>;
    }) => patch<CustomReportRecord>(`/analytics/reports/${vars.id}`, vars.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<unknown>(`/analytics/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
    },
  });
}

export function useExecuteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; format?: "json" | "csv" }) =>
      post<ReportExecutionRecord>(
        `/analytics/reports/${vars.id}/execute`,
        { format: vars.format ?? "json" },
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.reportExecutions(vars.id),
      });
    },
  });
}

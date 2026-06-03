import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface QueueMetric {
  name: string;
  description: string;
  color: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  avgProcessTime: number;
  health: "healthy" | "warning" | "critical";
}

export interface QueueJob {
  id: string;
  name: string;
  status: string;
  data: Record<string, unknown>;
  attemptsMade: number;
  attemptsLimit: number;
  createdAt: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  stacktrace?: string[];
}

export interface DLQJob {
  id: string;
  queueName: string;
  jobId: string;
  jobType: string;
  error: string;
  attempts: number;
  createdAt: string;
}

// ─── Queue Metrics ────────────────────────────────────────────────

export function useQueueMetrics() {
  return useQuery({
    queryKey: ["queue-metrics"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/metrics`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<{
        queues: QueueMetric[];
        historical: unknown[];
      }>;
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

// ─── Queue Jobs ───────────────────────────────────────────────────

export function useQueueJobs(queueName: string, status: string) {
  return useQuery({
    queryKey: ["queue-jobs", queueName, status],
    queryFn: async () => {
      const qs = new URLSearchParams({ status, start: "0", end: "49" });
      const res = await fetch(
        `${API_URL}/admin/queue/${encodeURIComponent(queueName)}/jobs?${qs}`,
        { credentials: "include" },
      );
      const json = (await res.json()) as ApiResponse<{
        jobs: QueueJob[];
        stats: Record<string, number>;
      }>;
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    refetchInterval: 5000,
    enabled: !!queueName,
  });
}

// ─── Job Actions ──────────────────────────────────────────────────

export function useRetryJob(queueName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(
        `${API_URL}/admin/queue/${encodeURIComponent(queueName)}/jobs/${jobId}/retry`,
        { method: "POST", credentials: "include" },
      );
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-jobs"] });
    },
  });
}

export function useRemoveJob(queueName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(
        `${API_URL}/admin/queue/${encodeURIComponent(queueName)}/jobs/${jobId}/remove`,
        { method: "POST", credentials: "include" },
      );
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-jobs"] });
    },
  });
}

export function usePauseQueue(queueName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${API_URL}/admin/queue/${encodeURIComponent(queueName)}/pause`,
        { method: "POST", credentials: "include" },
      );
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-metrics"] });
    },
  });
}

export function useResumeQueue(queueName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${API_URL}/admin/queue/${encodeURIComponent(queueName)}/resume`,
        { method: "POST", credentials: "include" },
      );
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-metrics"] });
    },
  });
}

// ─── Dead Letter Queue ────────────────────────────────────────────

export function useDLQJobs(queueName?: string) {
  return useQuery({
    queryKey: ["dlq-jobs", queueName],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (queueName) qs.set("queueName", queueName);
      const res = await fetch(`${API_URL}/admin/dead-letters?${qs}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<{
        jobs: DLQJob[];
        total: number;
      }>;
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    refetchInterval: 10000,
  });
}

export function useRetryDLQJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dlqId: string) => {
      const res = await fetch(
        `${API_URL}/admin/dead-letters/${dlqId}/retry`,
        { method: "POST", credentials: "include" },
      );
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dlq-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-metrics"] });
    },
  });
}

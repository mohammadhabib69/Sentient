"use client";

import * as React from "react";
import {
  useQueueMetrics,
  useQueueJobs,
  useDLQJobs,
  useRetryJob,
  useRemoveJob,
  useRetryDLQJob,
} from "@/hooks/useQueueMonitoring";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  RotateCcw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const HEALTH_COLORS = {
  healthy: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
};

const QUEUE_NAMES = [
  { key: "ai-queue", label: "AI" },
  { key: "email-queue", label: "Email" },
  { key: "pdf-queue", label: "PDF" },
  { key: "schedule-queue", label: "Schedule" },
  { key: "webhook-queue", label: "Webhook" },
];

const JOB_STATUSES = ["waiting", "active", "completed", "failed"] as const;

export default function QueueMonitoringPage() {
  const { data: metricsData, isLoading } = useQueueMetrics();
  const [selectedQueue, setSelectedQueue] = React.useState("ai-queue");
  const [jobStatus, setJobStatus] = React.useState<"waiting" | "active" | "completed" | "failed">("waiting");
  const [activeTab, setActiveTab] = React.useState<"dashboard" | "jobs" | "dlq">("dashboard");

  const { data: jobsData } = useQueueJobs(selectedQueue, jobStatus);
  const { data: dlqData } = useDLQJobs();
  const retryJob = useRetryJob(selectedQueue);
  const removeJob = useRemoveJob(selectedQueue);
  const retryDLQ = useRetryDLQJob();

  const handleRetryJob = async (jobId: string) => {
    try {
      await retryJob.mutateAsync(jobId);
      toast.success("Job retried");
    } catch {
      toast.error("Failed to retry job");
    }
  };

  const handleRemoveJob = async (jobId: string) => {
    try {
      await removeJob.mutateAsync(jobId);
      toast.success("Job removed");
    } catch {
      toast.error("Failed to remove job");
    }
  };

  const handleRetryDLQ = async (dlqId: string) => {
    try {
      await retryDLQ.mutateAsync(dlqId);
      toast.success("DLQ job retried");
    } catch {
      toast.error("Failed to retry DLQ job");
    }
  };

  // Prepare chart data from metrics
  const chartData = metricsData?.historical
    ? metricsData.historical.map((batch: any, i: number) => {
        const entry: Record<string, string | number> = { index: i };
        if (Array.isArray(batch)) {
          for (const q of batch) {
            entry[`${q.name}-waiting`] = q.waiting;
            entry[`${q.name}-active`] = q.active;
            entry[`${q.name}-failed`] = q.failed;
          }
        }
        return entry;
      })
    : [];

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue Monitoring</h1>
          <p className="text-sm text-[var(--foreground-3)] mt-1">
            Real-time queue health, job browser, and dead letter management
          </p>
        </div>
        <div className="flex gap-2">
          {(["dashboard", "jobs", "dlq"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab === "dlq" ? "Dead Letters" : tab}
            </Button>
          ))}
        </div>
      </div>

      {/* ─── Dashboard Tab ────────────────────────────────────── */}
      {activeTab === "dashboard" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricsData?.queues.map((q) => (
              <Card key={q.name} className="border-[var(--glass-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: q.color }}
                    />
                    {q.name.replace("-queue", "")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-[var(--foreground-3)]">
                      <Clock className="size-3" />
                      <span>{q.waiting}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--foreground-3)]">
                      <Activity className="size-3" />
                      <span>{q.active}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--foreground-3)]">
                      <CheckCircle className="size-3" />
                      <span>{q.completed}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--foreground-3)]">
                      <AlertTriangle className="size-3" />
                      <span>{q.failed}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[var(--foreground-3)]">
                      {Math.round(q.avgProcessTime)}ms avg
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{
                        color: HEALTH_COLORS[q.health],
                        borderColor: HEALTH_COLORS[q.health],
                      }}
                    >
                      {q.health}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card className="border-[var(--glass-border)]">
              <CardHeader>
                <CardTitle className="text-sm">Queue Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="index" hide />
                    <YAxis fontSize={10} tickFormatter={(v) => `${v}`} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="ai-queue-waiting"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      name="AI Waiting"
                    />
                    <Area
                      type="monotone"
                      dataKey="email-queue-waiting"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                      name="Email Waiting"
                    />
                    <Area
                      type="monotone"
                      dataKey="pdf-queue-waiting"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.2}
                      name="PDF Waiting"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Queue stats table */}
          <Card className="border-[var(--glass-border)]">
            <CardHeader>
              <CardTitle className="text-sm">Queue Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Queue</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Waiting</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Active</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Completed</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Failed</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Delayed</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Avg Time</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricsData?.queues.map((q) => (
                      <tr
                        key={q.name}
                        className="border-b border-[var(--glass-border)]/50"
                      >
                        <td className="py-2 px-3 font-medium">{q.name}</td>
                        <td className="py-2 px-3 text-center">{q.waiting}</td>
                        <td className="py-2 px-3 text-center">{q.active}</td>
                        <td className="py-2 px-3 text-center">{q.completed}</td>
                        <td className="py-2 px-3 text-center" style={{ color: q.failed > 0 ? "#ef4444" : undefined }}>
                          {q.failed}
                        </td>
                        <td className="py-2 px-3 text-center">{q.delayed}</td>
                        <td className="py-2 px-3 text-center">{Math.round(q.avgProcessTime)}ms</td>
                        <td className="py-2 px-3 text-center">
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{
                              color: HEALTH_COLORS[q.health],
                              borderColor: HEALTH_COLORS[q.health],
                            }}
                          >
                            {q.health}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Jobs Tab ───────────────────────────────────────── */}
      {activeTab === "jobs" && (
        <Card className="border-[var(--glass-border)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Job Browser</CardTitle>
              <div className="flex gap-2">
                {/* Queue selector */}
                <select
                  value={selectedQueue}
                  onChange={(e) => setSelectedQueue(e.target.value)}
                  className="rounded-md border border-[var(--glass-border)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                >
                  {QUEUE_NAMES.map((q) => (
                    <option key={q.key} value={q.key}>
                      {q.label} Queue
                    </option>
                  ))}
                </select>
                {/* Status filter */}
                {JOB_STATUSES.map((s) => (
                  <Button
                    key={s}
                    variant={jobStatus === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setJobStatus(s)}
                    className="capitalize text-xs"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {jobsData?.jobs && jobsData.jobs.length > 0 ? (
              <ScrollArea className="max-h-[500px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Job ID</th>
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Type</th>
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Created</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Attempts</th>
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Error</th>
                      <th className="text-right py-2 px-3 font-medium text-[var(--foreground-3)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobsData.jobs.map((job) => (
                      <tr key={job.id} className="border-b border-[var(--glass-border)]/50">
                        <td className="py-2 px-3 font-mono text-[10px]">
                          {job.id.slice(0, 8)}...
                        </td>
                        <td className="py-2 px-3">{job.name}</td>
                        <td className="py-2 px-3 capitalize">{job.status}</td>
                        <td className="py-2 px-3">
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {job.attemptsMade}/{job.attemptsLimit}
                        </td>
                        <td className="py-2 px-3 text-[10px] text-red-500 max-w-[200px] truncate">
                          {job.failedReason ?? "—"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-6 p-0"
                              onClick={() => handleRetryJob(job.id)}
                              title="Retry"
                            >
                              <RotateCcw className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-6 p-0 text-red-500"
                              onClick={() => handleRemoveJob(job.id)}
                              title="Remove"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            ) : (
              <div className="text-center text-[var(--foreground-3)] py-8 text-sm">
                No jobs in this status
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Dead Letters Tab ───────────────────────────────── */}
      {activeTab === "dlq" && (
        <Card className="border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              Dead Letter Queue
              {dlqData && (
                <Badge variant="outline">{dlqData.total} jobs</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dlqData?.jobs && dlqData.jobs.length > 0 ? (
              <ScrollArea className="max-h-[500px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Queue</th>
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Job Type</th>
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Error</th>
                      <th className="text-center py-2 px-3 font-medium text-[var(--foreground-3)]">Attempts</th>
                      <th className="text-left py-2 px-3 font-medium text-[var(--foreground-3)]">Created</th>
                      <th className="text-right py-2 px-3 font-medium text-[var(--foreground-3)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dlqData.jobs.map((job) => (
                      <tr key={job.id} className="border-b border-[var(--glass-border)]/50">
                        <td className="py-2 px-3 font-mono text-[10px]">
                          {job.queueName}
                        </td>
                        <td className="py-2 px-3">{job.jobType}</td>
                        <td className="py-2 px-3 text-[10px] text-red-500 max-w-[300px] truncate">
                          {job.error}
                        </td>
                        <td className="py-2 px-3 text-center">{job.attempts}</td>
                        <td className="py-2 px-3">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-6 p-0"
                            onClick={() => handleRetryDLQ(job.id)}
                            title="Retry"
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            ) : (
              <div className="text-center text-[var(--foreground-3)] py-8 text-sm">
                No dead letter jobs
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="size-6 animate-spin text-[var(--foreground-3)]" />
          <span className="ml-2 text-sm text-[var(--foreground-3)]">Loading queue metrics...</span>
        </div>
      )}
    </div>
  );
}

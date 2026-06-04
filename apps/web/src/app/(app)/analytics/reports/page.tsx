"use client";

import * as React from "react";
import { ArrowLeft, FileText, Play, Trash2, Plus, X } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  useReports,
  useCreateReport,
  useDeleteReport,
  useExecuteReport,
  useReportExecutions,
  type CustomReportRecord,
  type ReportExecutionRecord,
} from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

const ALL_METRICS = [
  "overview",
  "velocity",
  "agents",
  "projects",
  "forecasts",
  "anomalies",
];

export default function ReportsPage() {
  const { data, isLoading } = useReports();
  const create = useCreateReport();
  const del = useDeleteReport();
  const execute = useExecuteReport();
  const [showForm, setShowForm] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  return (
    <PageTransition className="flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/analytics"
            className="text-[11px] font-mono text-[var(--foreground-3)] hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="size-3" /> Overview
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
            <FileText className="size-5 text-[hsl(var(--primary))]" />
            Custom Reports
          </h1>
          <p className="text-[13px] text-[var(--foreground-2)]">
            Bundle metrics into exportable reports
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-white"
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Cancel" : "New report"}
        </button>
      </div>

      {showForm && (
        <NewReportForm
          onSubmit={(payload) => {
            create.mutate(payload, {
              onSuccess: () => setShowForm(false),
            });
          }}
          isSubmitting={create.isPending}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {isLoading || !data ? (
            <div className="glass-panel rounded-xl p-5 text-sm text-[var(--foreground-3)] font-mono">
              Loading reports…
            </div>
          ) : data.length === 0 ? (
            <div className="glass-panel rounded-xl p-5 text-sm text-[var(--foreground-3)] font-mono">
              No reports yet · create one to get started
            </div>
          ) : (
            data.map((r) => (
              <ReportListItem
                key={r.id}
                report={r}
                active={selectedId === r.id}
                onClick={() => setSelectedId(r.id)}
              />
            ))
          )}
        </div>

        {/* Detail / executions */}
        <div className="lg:col-span-2 space-y-4">
          {selectedId ? (
            <ReportDetail
              reportId={selectedId}
              onExecute={(format) => execute.mutate({ id: selectedId, format })}
              onDelete={() => del.mutate(selectedId)}
              executing={execute.isPending}
              deleting={del.isPending}
            />
          ) : (
            <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
              Select a report to view details and run it
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function NewReportForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (payload: {
    name: string;
    description?: string;
    metrics: string[];
  }) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set(["overview"]));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || selected.size === 0) return;
        onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
          metrics: Array.from(selected),
        });
      }}
      className="glass-panel rounded-xl p-5 space-y-3"
    >
      <h3 className="text-sm font-bold text-foreground">New custom report</h3>
      <input
        type="text"
        placeholder="Report name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-md border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] resize-none"
        rows={2}
      />
      <div>
        <div className="text-[11px] font-mono uppercase text-[var(--foreground-3)] mb-2">
          Metrics
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_METRICS.map((m) => {
            const active = selected.has(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setSelected((s) => {
                    const next = new Set(s);
                    if (next.has(m)) next.delete(m);
                    else next.add(m);
                    return next;
                  });
                }}
                className={cn(
                  "rounded-md border px-3 py-1 text-[11px] font-mono uppercase transition-colors",
                  active
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                    : "border-[var(--glass-border)] text-[var(--foreground-3)] hover:text-foreground",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || selected.size === 0}
          className={cn(
            "rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white",
            (isSubmitting || !name.trim() || selected.size === 0) && "opacity-50",
          )}
        >
          {isSubmitting ? "Creating…" : "Create report"}
        </button>
      </div>
    </form>
  );
}

function ReportListItem({
  report,
  active,
  onClick,
}: {
  report: CustomReportRecord;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg p-3 border transition-colors",
        active
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
          : "border-[var(--glass-border)] bg-[var(--surface-2)] hover:border-[hsl(var(--primary))]/40",
      )}
    >
      <div className="font-semibold text-foreground">{report.name}</div>
      {report.description && (
        <div className="text-[11px] text-[var(--foreground-3)] mt-0.5">
          {report.description}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {report.metrics.map((m) => (
          <span
            key={m}
            className="rounded border border-[var(--glass-border)] bg-[var(--surface-3)] px-1.5 py-0.5 text-[9px] font-mono uppercase"
          >
            {m}
          </span>
        ))}
      </div>
    </button>
  );
}

function ReportDetail({
  reportId,
  onExecute,
  onDelete,
  executing,
  deleting,
}: {
  reportId: string;
  onExecute: (format: "json" | "csv") => void;
  onDelete: () => void;
  executing: boolean;
  deleting: boolean;
}) {
  const executions = useReportExecutions(reportId);

  return (
    <>
      <div className="glass-panel rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Run report</h3>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-[var(--foreground-3)] hover:text-red transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onExecute("json")}
            disabled={executing}
            className="rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="size-4" />
            {executing ? "Running…" : "Run as JSON"}
          </button>
          <button
            type="button"
            onClick={() => onExecute("csv")}
            disabled={executing}
            className="rounded-md border border-[var(--glass-border)] px-3 py-2 text-sm font-semibold text-foreground inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="size-4" />
            Run as CSV
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Recent executions</h3>
        {executions.isLoading || !executions.data ? (
          <div className="text-sm text-[var(--foreground-3)] font-mono py-4 text-center">
            Loading…
          </div>
        ) : executions.data.length === 0 ? (
          <div className="text-sm text-[var(--foreground-3)] font-mono py-4 text-center">
            No executions yet
          </div>
        ) : (
          <div className="space-y-2">
            {executions.data.map((e) => (
              <ExecutionRow key={e.id} execution={e} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ExecutionRow({ execution }: { execution: ReportExecutionRecord }) {
  const color =
    execution.status === "completed"
      ? "text-forest-green"
      : execution.status === "failed"
        ? "text-red"
        : "text-amber";
  return (
    <div className="rounded border border-[var(--glass-border)] bg-[var(--surface-2)] p-3 text-[11px] font-mono">
      <div className="flex items-center justify-between">
        <span className={`font-bold uppercase ${color}`}>{execution.status}</span>
        <span className="text-[var(--foreground-3)]">
          {new Date(execution.createdAt).toLocaleString()}
        </span>
      </div>
      {execution.error && (
        <p className="mt-1 text-red">{execution.error}</p>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { ArrowLeft, Camera, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  useSnapshots,
  useCreateSnapshot,
  useDeleteSnapshot,
  type SnapshotRecord,
} from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

export default function SnapshotsPage() {
  const { data, isLoading } = useSnapshots(20);
  const create = useCreateSnapshot();
  const del = useDeleteSnapshot();
  const [name, setName] = React.useState("");

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
            <Camera className="size-5 text-[hsl(var(--primary))]" />
            Snapshots
          </h1>
          <p className="text-[13px] text-[var(--foreground-2)]">
            Save the current dashboard state for comparison later
          </p>
        </div>
      </div>

      {/* Create form */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Capture current state</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            create.mutate(
              { name: name.trim() },
              { onSuccess: () => setName("") },
            );
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Snapshot name (e.g. 'Pre-launch baseline')"
            className="flex-1 rounded-md border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            maxLength={120}
          />
          <button
            type="submit"
            disabled={create.isPending || !name.trim()}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white transition-opacity",
              (create.isPending || !name.trim()) && "opacity-50",
            )}
          >
            <Plus className="size-4" />
            {create.isPending ? "Capturing…" : "Capture"}
          </button>
        </form>
        {create.isSuccess && (
          <p className="mt-2 text-[11px] font-mono text-forest-green">
            ✓ Snapshot captured
          </p>
        )}
        {create.isError && (
          <p className="mt-2 text-[11px] font-mono text-red">
            ✗ {String(create.error?.message ?? "Capture failed")}
          </p>
        )}
      </div>

      {/* List */}
      {isLoading || !data ? (
        <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
          Loading snapshots…
        </div>
      ) : data.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
          No snapshots yet · capture one to start comparing
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((s) => (
            <SnapshotCard
              key={s.id}
              snapshot={s}
              onDelete={() => del.mutate(s.id)}
              deleting={del.isPending}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}

function SnapshotCard({
  snapshot,
  onDelete,
  deleting,
}: {
  snapshot: SnapshotRecord;
  onDelete: () => void;
  deleting: boolean;
}) {
  const data = snapshot.snapshotData as {
    capturedAt?: string;
    overview?: { activeTasks?: number; projectHealth?: number };
    velocity?: { weeklyAverage?: number; trend?: string };
  };
  return (
    <div className="glass-panel rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{snapshot.name}</h3>
          {snapshot.description && (
            <p className="text-xs text-[var(--foreground-3)] mt-1">
              {snapshot.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="text-[var(--foreground-3)] hover:text-red transition-colors"
          aria-label="Delete snapshot"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
        <Mini label="Active" value={data.overview?.activeTasks ?? "—"} />
        <Mini label="Health" value={data.overview ? `${data.overview.projectHealth}%` : "—"} />
        <Mini label="Velocity" value={data.velocity ? `${data.velocity.weeklyAverage?.toFixed(1)}` : "—"} />
      </div>

      <p className="text-[10px] font-mono text-[var(--foreground-3)]">
        Captured {new Date(snapshot.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-[var(--glass-border)] bg-[var(--surface-2)] px-2 py-1.5 text-center">
      <div className="text-[8px] uppercase tracking-wider text-[var(--foreground-3)]">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldAlert, Activity, HeartPulse } from "lucide-react";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

/**
 * LiveMetricsGrid — Phase 6 §11. Renders the four dashboard metric
 * cards driven by `dashboardMetrics` in `useUIStore`.
 *
 * Source of truth is the server's `metrics:updated` event. While the
 * first paint is in flight we show a neutral skeleton (the `null`
 * branch). When a fresh value arrives we pulse the card border briefly
 * so the user can tell something changed.
 */
export function LiveMetricsGrid() {
  const metrics = useUIStore((s) => s.dashboardMetrics);
  const [pulse, setPulse] = React.useState(false);
  const prevActive = React.useRef<number | null>(null);

  // Briefly pulse the cards when the active-tasks number changes.
  React.useEffect(() => {
    if (!metrics) return;
    if (
      prevActive.current !== null &&
      prevActive.current !== metrics.activeTasks
    ) {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 700);
      return () => window.clearTimeout(t);
    }
    prevActive.current = metrics.activeTasks;
    return undefined;
  }, [metrics?.activeTasks, metrics]);

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Tasks" value={0} icon={CheckCircle2} subtext="Loading…" />
        <MetricCard title="Pending Approvals" value={0} icon={ShieldAlert} subtext="Loading…" />
        <MetricCard title="Agent Actions" value={0} icon={Activity} subtext="Today" />
        <MetricCard title="System Health" value="—" icon={HeartPulse} subtext="Loading…" />
      </div>
    );
  }

  const pendingCount = metrics.pendingApprovals;
  const healthPct = `${(metrics.healthScore * 100).toFixed(0)}%`;

  return (
    <AnimatePresence>
      <motion.div
        layout
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-shadow",
          pulse && "shadow-[0_0_0_2px_var(--primary)]/30 rounded-xl",
        )}
      >
        <MetricCard
          title="Active Tasks"
          value={metrics.activeTasks}
          subtext="across all projects"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingCount}
          subtext={pendingCount > 0 ? "Requires attention" : "All clear"}
          icon={ShieldAlert}
          amberTint={pendingCount > 0}
        />
        <MetricCard
          title="Agent Actions"
          value={metrics.agentActionsToday}
          subtext="executed today"
          icon={Activity}
        />
        <MetricCard
          title="System Health"
          value={healthPct}
          subtext={
            metrics.healthScore >= 0.8
              ? "Healthy"
              : metrics.healthScore >= 0.5
                ? "Operational"
                : "Needs attention"
          }
          icon={HeartPulse}
        />
      </motion.div>
    </AnimatePresence>
  );
}

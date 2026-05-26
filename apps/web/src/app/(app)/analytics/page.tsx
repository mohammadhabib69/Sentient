"use client"

import * as React from "react"
import { VelocityChart } from "@/components/analytics/VelocityChart"
import { AgentBreakdownChart } from "@/components/analytics/AgentBreakdownChart"
import { ProductivityHeatmap } from "@/components/analytics/ProductivityHeatmap"
import { HealthScoreChart } from "@/components/analytics/HealthScoreChart"
import { AnomalyAlerts } from "@/components/analytics/AnomalyAlerts"
import { PageTransition } from "@/components/shared/PageTransition"
import { BarChart3, Download } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <PageTransition className="flex h-full flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BarChart3 className="size-6 text-[hsl(var(--primary))]" />
            Organization Analytics
          </h1>
          <p className="text-sm text-[var(--foreground-2)] mt-1">
            Macro-level metrics across all workspaces and agent fleets.
          </p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-[var(--surface-2)]">
          <Download className="size-4" />
          Export Report
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 pb-20">
        
        {/* Top Row: Velocity (span 2) + Health (span 1) */}
        <div className="lg:col-span-2 h-[380px]">
          <VelocityChart />
        </div>
        <div className="lg:col-span-1 h-[380px]">
          <HealthScoreChart />
        </div>

        {/* Middle Row: Agent Breakdown (span 2) + Heatmap (span 1) */}
        <div className="lg:col-span-2 h-[380px]">
          <AgentBreakdownChart />
        </div>
        <div className="lg:col-span-1 h-[380px]">
          <ProductivityHeatmap />
        </div>

        {/* Bottom Row: Anomalies */}
        <div className="lg:col-span-3 h-[300px]">
          <AnomalyAlerts />
        </div>

      </div>
    </PageTransition>
  )
}

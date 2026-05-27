"use client";

import * as React from "react";
import { MOCK_HEATMAP_DATA } from "@/mocks/fixtures/analytics.fixture";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductivityHeatmap() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] shadow-sm">
      <div className="border-b border-[var(--glass-border)] p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Calendar className="size-4 text-[hsl(var(--primary))]" />
          Productivity Heatmap
        </h3>
        <p className="mt-1 text-xs text-[var(--foreground-3)]">Daily task completions (90 Days)</p>
      </div>
      <div className="flex-1 p-5 overflow-x-auto">
        <div className="flex gap-1">
          {/* Extremely naive calendar heatmap grid layout for demo purposes */}
          {Array.from({ length: 12 }).map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, rowIndex) => {
                const index = colIndex * 7 + rowIndex;
                if (index >= 90) return null;
                const data = MOCK_HEATMAP_DATA[index];

                // Color intensity logic
                let intensityClass = "bg-[var(--surface-3)]"; // empty
                if (data && data.value > 80) intensityClass = "bg-[hsl(var(--primary))]";
                else if (data && data.value > 50) intensityClass = "bg-[hsl(var(--primary))]/70";
                else if (data && data.value > 20) intensityClass = "bg-[hsl(var(--primary))]/40";
                else if (data && data.value > 0) intensityClass = "bg-[hsl(var(--primary))]/20";

                return (
                  <div
                    key={rowIndex}
                    className={cn("size-3.5 rounded-[2px]", intensityClass)}
                    title={data ? `${data.value} tasks on ${data.date}` : ""}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--foreground-3)]">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="size-3 rounded-[2px] bg-[var(--surface-3)]" />
            <div className="size-3 rounded-[2px] bg-[hsl(var(--primary))]/20" />
            <div className="size-3 rounded-[2px] bg-[hsl(var(--primary))]/40" />
            <div className="size-3 rounded-[2px] bg-[hsl(var(--primary))]/70" />
            <div className="size-3 rounded-[2px] bg-[hsl(var(--primary))]" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

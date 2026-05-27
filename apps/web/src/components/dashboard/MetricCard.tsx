"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  amberTint?: boolean;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  amberTint,
  onClick,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border p-5 shadow-sm transition-colors",
        amberTint
          ? "border-[var(--amber)]/30 bg-[var(--amber)]/5 hover:bg-[var(--amber)]/10"
          : "border-[var(--glass-border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--foreground-2)]">{title}</p>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg bg-opacity-20",
            amberTint
              ? "bg-[var(--amber)] text-[var(--amber)]"
              : "bg-[var(--foreground-3)] text-[var(--foreground-2)]",
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight text-foreground">
          <AnimatedNumber value={value} />
        </h3>
        {subtext && <p className="mt-1 text-xs text-[var(--foreground-3)]">{subtext}</p>}
      </div>

      {amberTint && (
        <span className="absolute right-0 top-0 flex size-full h-1">
          <span className="absolute right-3 top-3 flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--amber)] opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-[var(--amber)]"></span>
          </span>
        </span>
      )}
    </motion.div>
  );
}

"use client";

import * as React from "react";
import { Bot, Cpu, DollarSign, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentType = "operations" | "finance" | "customer" | "dev" | string;

interface AgentAvatarProps {
  type: AgentType;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { wrapper: "size-6", icon: "size-3" },
  md: { wrapper: "size-8", icon: "size-4" },
  lg: { wrapper: "size-12", icon: "size-6" },
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; fg: string }> = {
  operations: { icon: Cpu, bg: "bg-primary/10", fg: "text-primary" },
  finance: { icon: DollarSign, bg: "bg-green/10", fg: "text-green" },
  customer: { icon: Headphones, bg: "bg-secondary/10", fg: "text-secondary" },
  dev: { icon: Bot, bg: "bg-amber/10", fg: "text-amber" },
};

export function AgentAvatar({ type, name, size = "md", className }: AgentAvatarProps) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.operations!;
  const sizeConfig = SIZES[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-[var(--glass-border)]",
        sizeConfig.wrapper,
        config.bg,
        className,
      )}
      title={name ?? type}
    >
      {/* @ts-ignore */}
      <Icon className={cn(sizeConfig.icon, config.fg)} />
    </div>
  );
}

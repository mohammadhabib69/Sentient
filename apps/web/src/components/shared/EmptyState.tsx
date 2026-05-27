"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--surface-1)] px-8 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--foreground-3)]">
        {/* @ts-ignore */}
        <Icon className="size-7" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--foreground-3)]">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

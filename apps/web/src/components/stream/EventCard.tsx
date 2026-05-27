"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CheckCheck,
  FileText,
  Network,
  Server,
  Terminal,
  User,
} from "lucide-react";
import { StreamEvent, StreamEventVariant } from "@/types/event.types";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: StreamEvent;
  onClick: (event: StreamEvent) => void;
  isActive: boolean;
}

function resolveVariant(event: StreamEvent): StreamEventVariant {
  if (event.display?.variant) return event.display.variant;
  if (event.type === "webhook_failed" || event.type === "error") return "critical";
  if (event.type.includes("anomaly")) return "anomaly";
  if (event.actor.type === "agent") return "suggestion";
  if (event.actor.type === "user") return "approval";
  return "system";
}

const variantStyles: Record<
  StreamEventVariant,
  {
    accent: string;
    avatarBorder: string;
    avatarText: string;
    avatarGlow: string;
    badge: string;
    cardBorder: string;
    cardRing?: string;
    actionHover: string;
  }
> = {
  suggestion: {
    accent: "bg-mist-teal",
    avatarBorder: "border-mist-teal/50",
    avatarText: "text-mist-teal",
    avatarGlow: "shadow-[0_0_12px_rgba(116,149,155,0.15)]",
    badge: "bg-mist-teal/10 text-mist-teal border-mist-teal/20",
    cardBorder: "border-glass-border hover:border-mist-teal/30",
    actionHover: "group-hover:text-mist-teal",
  },
  anomaly: {
    accent: "bg-amber-alert",
    avatarBorder: "border-amber-alert/50",
    avatarText: "text-amber-alert",
    avatarGlow: "shadow-[0_0_12px_rgba(212,135,74,0.15)]",
    badge: "bg-amber-alert/10 text-amber-alert border-amber-alert/20",
    cardBorder: "border-amber-alert/20 hover:border-amber-alert/40",
    cardRing: "ring-1 ring-amber-alert/10",
    actionHover: "text-amber-alert hover:text-amber-alert/80",
  },
  approval: {
    accent: "bg-outline-variant",
    avatarBorder: "border-outline-variant",
    avatarText: "text-outline-variant",
    avatarGlow: "",
    badge: "bg-surface-variant text-outline-variant border-glass-border",
    cardBorder: "border-glass-border hover:border-outline-variant/30",
    actionHover: "group-hover:text-outline-variant",
  },
  critical: {
    accent: "bg-error-red",
    avatarBorder: "border-error-red/50",
    avatarText: "text-error-red",
    avatarGlow: "shadow-[0_0_12px_rgba(192,80,74,0.15)]",
    badge: "bg-error-red/10 text-error-red border-error-red/20",
    cardBorder: "border-error-red/20 hover:border-error-red/40",
    cardRing: "ring-1 ring-error-red/5",
    actionHover: "text-error-red hover:text-error-red/80",
  },
  system: {
    accent: "bg-outline-variant",
    avatarBorder: "border-glass-border",
    avatarText: "text-on-surface-variant",
    avatarGlow: "",
    badge: "bg-surface-variant text-on-surface-variant border-glass-border",
    cardBorder: "border-glass-border",
    actionHover: "group-hover:text-mist-teal",
  },
};

function AvatarContent({ event, variant }: { event: StreamEvent; variant: StreamEventVariant }) {
  const initials = event.display?.initials;
  if (initials) {
    return <span className="font-label-caps text-xs">{initials}</span>;
  }
  if (variant === "critical") return <Terminal className="size-[18px]" />;
  if (event.actor.type === "user") return <User className="size-[18px]" />;
  if (event.actor.type === "agent") return <Bot className="size-[18px]" />;
  return <Server className="size-[18px]" />;
}

function ResourceIcon({ variant }: { variant: StreamEventVariant }) {
  if (variant === "anomaly") return <Network className="size-[14px] text-on-surface-variant" />;
  if (variant === "approval") return <CheckCheck className="size-[14px] text-on-surface-variant" />;
  if (variant === "critical") return <Server className="size-[14px] text-on-surface-variant" />;
  return <FileText className="size-[14px] text-on-surface-variant" />;
}

export function EventCard({ event, onClick, isActive }: EventCardProps) {
  const variant = resolveVariant(event);
  const styles = variantStyles[variant];
  const badge = event.display?.badge ?? variant.toUpperCase();
  const description = event.display?.description ?? event.type.replace(/_/g, " ");
  const resourceLabel =
    event.display?.resourceLabel ?? `${event.aggregateType}:${event.aggregateId}`;
  const actionLabel = event.display?.actionLabel ?? "View Details";

  const timestamp = new Date(event.occurredAt).toISOString().slice(11, 23).replace("Z", " UTC");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(event)}
      className="group relative flex cursor-pointer items-start gap-4"
    >
      <div
        className={cn(
          "z-10 mt-2 flex size-10 shrink-0 items-center justify-center rounded-full border bg-surface-container-low",
          styles.avatarBorder,
          styles.avatarText,
          styles.avatarGlow,
        )}
      >
        <AvatarContent event={event} variant={variant} />
      </div>

      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-xl border bg-surface-container/60 p-4 backdrop-blur-[12px] transition-all hover:bg-surface-container hover:shadow-lg",
          styles.cardBorder,
          styles.cardRing,
          isActive && "border-mist-teal/40 ring-1 ring-mist-teal/30",
        )}
      >
        <div className={cn("absolute bottom-0 left-0 top-0 w-1", styles.accent)} />

        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-body-md font-semibold text-on-surface">{event.actor.name}</span>
            <span
              className={cn("rounded border px-2 py-0.5 font-label-caps text-[9px]", styles.badge)}
            >
              {badge}
            </span>
          </div>
          <span className="font-mono text-mono-xs text-on-surface-variant/80">{timestamp}</span>
        </div>

        <p
          className={cn(
            "mb-4 text-body-sm leading-relaxed",
            variant === "critical" ? "text-error-red/90" : "text-on-surface-variant",
          )}
        >
          {description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-md border border-glass-border bg-surface-container-low px-3 py-1.5">
            <ResourceIcon variant={variant} />
            <span className="font-mono text-mono-xs text-on-surface">{resourceLabel}</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-[13px] text-on-surface-variant transition-colors",
              styles.actionHover,
            )}
          >
            {actionLabel}
            <ArrowRight className="size-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        // Default: primary colored
        default:
          "rounded-full h-5 px-2 text-xs font-medium bg-[hsl(var(--primary))] text-white",
        // Secondary: muted style
        secondary:
          "rounded-full h-5 px-2 text-xs font-medium bg-[hsl(var(--secondary))]/15 text-[hsl(var(--secondary))]",
        // Outline: border only
        outline:
          "rounded-full h-5 px-2 text-xs font-medium border border-[hsl(var(--border))] text-foreground",

        // ── Sentient Status Variants ───────────────────────
        // Active / Done: green tint
        active:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[rgba(73,119,107,0.15)] text-[#49776B] dark:text-[#49776B]",
        // Pending / Warning: amber tint
        pending:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[rgba(212,135,74,0.15)] text-[var(--amber)]",
        // Blocked / Error: red tint
        blocked:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[rgba(192,80,74,0.15)] text-[var(--red)]",
        // Info: primary/teal tint
        info:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[rgba(116,149,155,0.15)] text-[hsl(var(--primary))]",

        // ── Status Badge Variants (Section 6.6) ───────────
        todo:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[var(--surface-2)] text-[var(--foreground-3)]",
        in_progress:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[hsl(var(--primary))]/12 text-[hsl(var(--primary))]",
        review:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[var(--amber-muted)] text-[var(--amber)]",
        done:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[hsl(var(--secondary))]/12 text-[hsl(var(--secondary))]",

        // ── Risk Level Variants ───────────────────────────
        low:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[rgba(73,119,107,0.15)] text-[hsl(var(--secondary))]",
        medium:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[var(--amber-muted)] text-[var(--amber)]",
        high:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[var(--red-muted)] text-[var(--red)]",
        critical:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[var(--red)] text-white",

        // Destructive: for shadcn compat
        destructive:
          "rounded-full h-5 px-2 text-xs font-medium bg-[var(--red-muted)] text-[var(--red)]",
        // Ghost
        ghost:
          "rounded-full h-5 px-2 text-xs font-medium hover:bg-muted hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

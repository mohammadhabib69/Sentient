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

        // Active / Done: green tint
        active:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-green/15 text-green",
        // Pending / Warning: amber tint
        pending:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-amber/15 text-amber",
        // Blocked / Error: red tint
        blocked:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-red/15 text-red",
        // Info: primary/teal tint
        info:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-primary/15 text-primary",

        // ── Status Badge Variants (Section 6.6) ───────────
        todo:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-[var(--surface-2)] text-[var(--foreground-3)]",
        in_progress:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-primary/12 text-primary",
        review:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-amber/12 text-amber",
        done:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-secondary/12 text-secondary",

        // ── Risk Level Variants ───────────────────────────
        low:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-green/15 text-secondary",
        medium:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-amber/12 text-amber",
        high:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-red/12 text-red",
        critical:
          "rounded-[6px] h-5 px-2 text-[11px] font-medium uppercase tracking-[0.05em] bg-red text-white",

        // Destructive: for shadcn compat
        destructive:
          "rounded-full h-5 px-2 text-xs font-medium bg-red/12 text-red",
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

import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "group/card flex flex-col gap-4 overflow-hidden text-sm text-card-foreground",
  {
    variants: {
      variant: {
        // Default: solid surface card with subtle border
        default:
          "rounded-[14px] bg-[var(--surface-1)] border border-[hsl(var(--border))] shadow-[var(--shadow-card)]",
        // Glass: translucent frosted glass panel
        glass:
          "rounded-[20px] bg-[var(--glass-bg)] backdrop-blur-[16px] backdrop-saturate-[180%] border border-[var(--glass-border)] shadow-[var(--shadow-float)]",
        // Agent: teal-tinted border for agent-specific cards
        agent:
          "rounded-[14px] bg-[var(--surface-1)] border border-[rgba(116,149,155,0.20)] shadow-[var(--shadow-card)]",
        // Warning: amber-tinted bg for attention cards
        warning:
          "rounded-[14px] bg-[var(--surface-1)] border border-[rgba(212,135,74,0.25)] shadow-[var(--shadow-card)]",
        // Ghost: no border, no shadow — flat embedded card
        ghost: "rounded-[14px] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return <div data-slot="card" className={cn(cardVariants({ variant }), className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 px-4 pt-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base leading-snug font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-[var(--foreground-2)]", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center border-t border-[hsl(var(--border))] px-4 py-3", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};

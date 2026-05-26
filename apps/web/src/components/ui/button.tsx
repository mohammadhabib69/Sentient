import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary: Forest green bg, white text — main CTA
        default:
          "bg-forest-green text-white hover:brightness-95 hover:bg-forest-green/90 active:bg-forest-green/80",
        // Secondary: translucent primary bg, primary border
        secondary:
          "bg-primary/10 text-primary border-primary/25 hover:bg-primary/18 active:bg-primary/25",
        // Outline: border only
        outline:
          "border-[hsl(var(--border))] bg-transparent text-foreground hover:bg-muted active:bg-[var(--surface-3)]",
        // Ghost: no border, no bg — text only
        ghost:
          "text-[var(--foreground-2)] hover:bg-muted hover:text-foreground active:bg-[var(--surface-3)]",
        // Danger: red-tinted bg, red border
        danger:
          "bg-red/12 text-red border-red/30 hover:bg-red/20 active:bg-red/28",
        // Destructive: alias of danger for shadcn compat
        destructive:
          "bg-red/12 text-red border-red/30 hover:bg-red/20 active:bg-red/28",
        // Link: text-only with underline
        link: "text-[hsl(var(--primary))] underline-offset-4 hover:underline",
        // Glass: translucent glass-style button for sidebar/floating panels
        glass:
          "bg-[var(--glass-bg)] text-foreground border-[var(--glass-border)] backdrop-blur-xl hover:bg-[var(--glass-bg)]/80",
      },
      size: {
        default: "h-9 gap-2 px-4",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-[0.8125rem]",
        lg: "h-10 gap-2 px-5 text-sm",
        xl: "h-12 gap-2.5 px-6 text-base rounded-full",
        icon: "size-9",
        "icon-sm": "size-8 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

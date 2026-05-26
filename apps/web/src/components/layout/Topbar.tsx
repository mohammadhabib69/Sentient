"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Search, Activity, Bell } from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/ui.store"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// ─── Breadcrumb Component ─────────────────────────────────────
function Breadcrumbs() {
  const pathname = usePathname()
  
  // Basic breadcrumb parsing based on pathname
  const paths = pathname.split('/').filter(Boolean)
  if (paths.length === 0) paths.push('dashboard')

  return (
    <div className="flex items-center text-sm">
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1
        const formatted = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')
        
        return (
          <React.Fragment key={path}>
            <span className={cn(
              "font-medium transition-colors",
              isLast ? "text-foreground" : "text-[var(--foreground-3)]"
            )}>
              {formatted}
            </span>
            {!isLast && (
              <span className="mx-2 text-[var(--foreground-3)]">/</span>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Search Pill Component ────────────────────────────────────
function SearchPill() {
  const { setSearchOpen } = useUIStore()

  // Listen for Cmd+K or Ctrl+K globally to open search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setSearchOpen])

  return (
    <button
      onClick={() => setSearchOpen(true)}
      className={cn(
        "group flex h-9 w-full max-w-[360px] items-center gap-2 rounded-full px-3",
        "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
        "text-sm text-muted-foreground shadow-sm transition-all duration-200",
        "hover:bg-[var(--glass-bg)] hover:shadow-[var(--shadow-card)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50"
      )}
    >
      <Search className="size-4 shrink-0 text-[var(--foreground-3)]" />
      <span className="flex-1 text-left truncate">Search operations, agents, logs...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded-[4px] border border-[var(--glass-border)] bg-[var(--surface-2)] px-1.5 font-mono text-[10px] font-medium text-[var(--foreground-2)] sm:flex opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px]">⌘</span>K
      </kbd>
    </button>
  )
}

// ─── Main Topbar Component ────────────────────────────────────
export function Topbar() {
  // We'll mock a notification count here, normally comes from a store
  const unreadNotifications = 3

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 w-full items-center justify-between px-6",
        "bg-topbar-bg backdrop-blur-[20px] backdrop-saturate-[160%] border-b border-glass-border transition-all duration-200"
      )}
    >
      {/* ── Left: Breadcrumbs ── */}
      <div className="flex flex-1 items-center justify-start">
        <Breadcrumbs />
      </div>

      {/* ── Center: Search Pill ── */}
      <div className="flex flex-1 items-center justify-center">
        <SearchPill />
      </div>

      {/* ── Right: Actions & User ── */}
      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <button 
          className="flex size-9 items-center justify-center rounded-full text-[var(--foreground-2)] hover:bg-muted hover:text-foreground transition-colors"
          title="Activity"
          aria-label="Activity"
        >
          <Activity className="size-[1.125rem]" />
        </button>

        <button 
          className="relative flex size-9 items-center justify-center rounded-full text-[var(--foreground-2)] hover:bg-muted hover:text-foreground transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="size-[1.125rem]" />
          {unreadNotifications > 0 && (
            <span className="absolute right-[9px] top-[9px] size-2 rounded-full bg-[var(--red)] border border-background" />
          )}
        </button>

        <div className="mx-1 h-4 w-px bg-border hidden sm:block" />

        <ThemeToggle />

        <button className="ml-1 flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background">
          <Avatar className="size-8">
            <AvatarImage src="/avatars/user.png" alt="User Avatar" />
            <AvatarFallback className="bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] text-xs font-semibold">
              MH
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  )
}

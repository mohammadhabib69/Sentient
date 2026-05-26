"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Bot,
  Activity,
  GitFork,
  FolderKanban,
  BarChart3,
  Code2,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Rocket,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore, hydrateSidebarState } from "@/store/ui.store"
import { useAgentStore } from "@/store/agent.store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"

// ─── Types ─────────────────────────────────────────────────────
interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  shortcut: string
  badge?: "agents"
}

// ─── Navigation Config ────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",      href: "/dashboard",   icon: LayoutDashboard, shortcut: "⌘1" },
  { label: "Agents",         href: "/agents",      icon: Bot,             shortcut: "⌘2", badge: "agents" },
  { label: "Reality Stream", href: "/stream",      icon: Activity,        shortcut: "⌘3" },
  { label: "Graph",          href: "/graph",       icon: GitFork,         shortcut: "⌘4" },
  { label: "Projects",       href: "/projects",    icon: FolderKanban,    shortcut: "⌘5" },
  { label: "Analytics",      href: "/analytics",   icon: BarChart3,       shortcut: "⌘6" },
  { label: "Developers",     href: "/developers",  icon: Code2,           shortcut: "⌘7" },
  { label: "Settings",       href: "/settings",    icon: Settings,        shortcut: "⌘8" },
]

// ─── Spring Config ────────────────────────────────────────────
const SPRING = { damping: 30, stiffness: 300, type: "spring" as const }

const SIDEBAR_EXPANDED = 240
const SIDEBAR_COLLAPSED = 72

// ─── Collapsed Tooltip Sub-Component ──────────────────────────
function NavTooltip({
  label,
  shortcut,
  visible,
}: {
  label: string
  shortcut: string
  visible: boolean
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.12, ease: "easeOut", delay: 0.06 }}
          className="pointer-events-none absolute left-[calc(72px+12px)] top-1/2 z-[60] -translate-y-1/2"
        >
          <div
            className="flex items-center gap-2 whitespace-nowrap rounded-[10px] px-3 py-2 text-sm"
            style={{
              background: "color-mix(in srgb, var(--glass-bg) 85%, transparent)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <span className="font-medium text-foreground">{label}</span>
            <span className="text-xs text-[var(--foreground-3)]">{shortcut}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Single Nav Item ──────────────────────────────────────────
function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
  pendingCount,
}: {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  pendingCount: number
}) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
          // Active state
          isActive && [
            "bg-[hsl(var(--primary))]/12 text-[hsl(var(--primary))]",
            "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-r-full before:bg-[hsl(var(--primary))]",
          ],
          // Inactive hover
          !isActive && "text-[var(--foreground-2)] hover:bg-[var(--glass-bg)] hover:text-foreground",
          // Collapsed: center icon
          isCollapsed && "justify-center px-0",
        )}
        aria-label={item.label}
      >
        {/* Icon */}
        {/* @ts-ignore */}
        {(() => { const Icon = item.icon; return <Icon className="size-5 shrink-0" /> })()}

        {/* Label — fades based on collapsed state */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.08,
                delay: isCollapsed ? 0 : 0.1,
              }}
              className="truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Amber badge dot for Agents pending */}
        {item.badge === "agents" && pendingCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "absolute size-2 rounded-full bg-[var(--amber)]",
              isCollapsed ? "right-3 top-2" : "right-3 top-1/2 -translate-y-1/2",
            )}
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--amber)] opacity-40" />
          </motion.span>
        )}
      </Link>

      {/* Collapsed tooltip */}
      {isCollapsed && <NavTooltip label={item.label} shortcut={item.shortcut} visible={hovered} />}
    </div>
  )
}

// ─── Main GlassSidebar Component ──────────────────────────────
export function GlassSidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const pendingApprovals = useAgentStore((s) => s.pendingApprovals)
  const pendingCount = pendingApprovals.filter((a) => a.status === "pending").length

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    hydrateSidebarState()
  }, [])

  // Global keyboard shortcuts ⌘1–⌘8
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return
      const num = parseInt(e.key)
      if (num >= 1 && num <= 8) {
        e.preventDefault()
        const item = NAV_ITEMS[num - 1]
        if (item) window.location.href = item.href
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Split nav: main items (0–6) and settings (7)
  const mainItems = NAV_ITEMS.slice(0, 7)
  const settingsItem = NAV_ITEMS[7]!

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
      transition={SPRING}
      className="fixed left-4 top-4 z-50 flex flex-col overflow-hidden"
      style={{
        height: "calc(100vh - 32px)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid var(--glass-border)",
        borderRadius: 20,
        boxShadow: "var(--shadow-float), inset 0 1px 0 var(--glass-highlight)",
      }}
    >
      {/* ── Toggle Button ─────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-[56px] z-[51] flex size-6 items-center justify-center rounded-full",
          "bg-[var(--surface-1)] border border-[hsl(var(--border))] shadow-sm",
          "text-[var(--foreground-2)] hover:text-foreground hover:bg-[var(--surface-2)]",
          "transition-colors duration-150",
        )}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          <ChevronsRight className="size-3.5" />
        ) : (
          <ChevronsLeft className="size-3.5" />
        )}
      </button>

      {/* ── Logo ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-2">
        {/* Logo mark */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        {/* Wordmark */}
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08, delay: 0.1 }}
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Sentient
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Workspace Switcher Placeholder ────────────── */}
      <div className="px-3 py-2">
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium",
            "text-[var(--foreground-2)] hover:bg-[var(--glass-bg)] hover:text-foreground",
            "transition-colors duration-150 truncate",
            sidebarCollapsed && "justify-center",
          )}
          aria-label="Switch workspace"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-[hsl(var(--secondary))]/20 text-[10px] font-bold text-[hsl(var(--secondary))]">
            E
          </span>
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08, delay: 0.1 }}
                className="truncate"
              >
                Engineering
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── Separator ─────────────────────────────────── */}
      <div className="mx-3 border-t border-[var(--glass-border)]" />

      {/* ── Main Navigation ───────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-0.5">
        {mainItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
            isCollapsed={sidebarCollapsed}
            pendingCount={item.badge === "agents" ? pendingCount : 0}
          />
        ))}
      </nav>

      {/* ── Separator ─────────────────────────────────── */}
      <div className="mx-3 border-t border-[var(--glass-border)]" />

      {/* ── Bottom Section ────────────────────────────── */}
      <div className="flex flex-col gap-1 px-3 py-3">
        {/* Settings */}
        <SidebarNavItem
          item={settingsItem}
          isActive={pathname.startsWith(settingsItem.href)}
          isCollapsed={sidebarCollapsed}
          pendingCount={0}
        />

        {/* User Avatar */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2",
            sidebarCollapsed && "justify-center px-0",
          )}
        >
          <Avatar className="size-7 shrink-0">
            <AvatarImage src="/avatars/user.png" alt="User" />
            <AvatarFallback className="bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] text-xs font-semibold">
              MH
            </AvatarFallback>
          </Avatar>
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08, delay: 0.1 }}
                className="flex flex-col truncate"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  Mohammad Habib
                </span>
                <span className="truncate text-xs text-[var(--foreground-3)]">
                  Super Admin
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Deploy Agent Button — expanded only */}
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.1, delay: 0.12 }}
            >
              <Link 
                href="/agents/builder"
                className={cn(buttonVariants({ variant: "glass", size: "sm" }), "w-full gap-2")}
              >
                <Rocket className="size-4" />
                Deploy Agent
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Settings, ArrowUpRight, X, Bot, User, Cpu, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/shared/PageTransition"

interface StreamEvent {
  id: string
  borderClass: string
  borderColorHex: string
  actor: {
    name: string
    role: string
    initials: string
    type: "agent" | "user" | "system"
  }
  badge: string
  time: string
  description: string
  entity: string
  payload: any
}

const SAMPLE_EVENTS: StreamEvent[] = [
  {
    id: "evt_1",
    borderClass: "border-l-primary",
    borderColorHex: "#74959B",
    actor: { name: "Flux", role: "Dev Agent", initials: "FL", type: "agent" },
    badge: "SUGGESTION",
    time: "Just now",
    description: "Suggests PR priority escalation on sentient-core due to dependency bottleneck.",
    entity: "project: sentient-core",
    payload: { action: "escalate_pr", repository: "sentient-core", reason: "dependency bottleneck", priority: "critical" }
  },
  {
    id: "evt_2",
    borderClass: "border-l-amber",
    borderColorHex: "#D4874A",
    actor: { name: "Nova", role: "Finance Agent", initials: "NV", type: "agent" },
    badge: "ANOMALY",
    time: "2m ago",
    description: "Detected anomaly in Stripe subscription processing batch #842. 3 transactions flagged for review.",
    entity: "billing: batch-842",
    payload: { code: "stripe_anomaly", batch_id: "842", flagged_transactions: 3, total_amount: 1420.00 }
  },
  {
    id: "evt_3",
    borderClass: "border-l-foreground-3",
    borderColorHex: "#5C6B5F",
    actor: { name: "Mohammad", role: "Admin", initials: "MH", type: "user" },
    badge: "APPROVAL",
    time: "15m ago",
    description: "Approved manual override for agent action #102. Deployment proceeded.",
    entity: "action: #102",
    payload: { action_id: 102, approved_by: "Mohammad", status: "proceeded" }
  },
  {
    id: "evt_4",
    borderClass: "border-l-primary",
    borderColorHex: "#74959B",
    actor: { name: "Aria", role: "Ops Agent", initials: "AR", type: "agent" },
    badge: "ACTION",
    time: "18m ago",
    description: "Reassigned task 'API Migration' from John (inactive 3d) to Sarah (available, 30% load)",
    entity: "task: API Migration",
    payload: { task: "API Migration", previous_assignee: "John", new_assignee: "Sarah", reason: "load balancer optimal assignment" }
  },
  {
    id: "evt_5",
    borderClass: "border-l-foreground-3",
    borderColorHex: "#5C6B5F",
    actor: { name: "James", role: "Dev", initials: "JD", type: "user" },
    badge: "UPDATE",
    time: "32m ago",
    description: "Updated task status: 'Deploy staging' from In Progress → Done",
    entity: "task: Deploy staging",
    payload: { task: "Deploy staging", prev_status: "in_progress", current_status: "done" }
  },
  {
    id: "evt_6",
    borderClass: "border-l-red",
    borderColorHex: "#C0504A",
    actor: { name: "System", role: "Service", initials: "SY", type: "system" },
    badge: "ERROR",
    time: "1h ago",
    description: "Agent Echo failed to connect to CRM API endpoint. Retry attempt 3/3 failed.",
    entity: "agent: Echo",
    payload: { endpoint: "/api/v1/crm", retries: "3/3", error_message: "Connection timed out after 10000ms" }
  },
  {
    id: "evt_7",
    borderClass: "border-l-primary",
    borderColorHex: "#74959B",
    actor: { name: "Flux", role: "Dev Agent", initials: "FL", type: "agent" },
    badge: "ACTION",
    time: "1h 15m ago",
    description: "Created GitHub issue #284: 'Repeated 500 errors on /api/tasks'",
    entity: "github: issue-284",
    payload: { issue_number: 284, title: "Repeated 500 errors on /api/tasks", created_by: "Flux" }
  },
  {
    id: "evt_8",
    borderClass: "border-l-amber",
    borderColorHex: "#D4874A",
    actor: { name: "Nova", role: "Finance Agent", initials: "NV", type: "agent" },
    badge: "ALERT",
    time: "2h ago",
    description: "Payment from Horizon Corp is 7 days overdue. Invoice #INV-2841 ($4,200)",
    entity: "billing: INV-2841",
    payload: { invoice_id: "INV-2841", client: "Horizon Corp", amount: 4200.00, overdue_days: 7 }
  }
]

export default function RealityStreamPage() {
  const [selectedEvent, setSelectedEvent] = React.useState<StreamEvent | null>(null)
  
  // Filters State
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["All"])
  const [selectedActor, setSelectedActor] = React.useState("All Actors")
  const [selectedEntity, setSelectedEntity] = React.useState("All")
  const [timeRange, setTimeRange] = React.useState("24h")
  const [searchQuery, setSearchQuery] = React.useState("")

  const toggleTypeFilter = (type: string) => {
    if (type === "All") {
      setSelectedTypes(["All"])
      return
    }
    const filtered = selectedTypes.filter(t => t !== "All")
    if (filtered.includes(type)) {
      const next = filtered.filter(t => t !== type)
      setSelectedTypes(next.length === 0 ? ["All"] : next)
    } else {
      setSelectedTypes([...filtered, type])
    }
  }

  const clearFilters = () => {
    setSelectedTypes(["All"])
    setSelectedActor("All Actors")
    setSelectedEntity("All")
    setTimeRange("24h")
    setSearchQuery("")
  }

  const filteredEvents = React.useMemo(() => {
    return SAMPLE_EVENTS.filter((event) => {
      // 1. Text Search query
      if (searchQuery) {
        const text = (event.description + " " + event.actor.name + " " + event.entity + " " + event.badge).toLowerCase()
        if (!text.includes(searchQuery.toLowerCase())) return false
      }

      // 2. Event type chip filters
      if (!selectedTypes.includes("All")) {
        const badgeMapping: Record<string, string> = {
          "Agent Actions": "ACTION,SUGGESTION",
          "User Actions": "APPROVAL,UPDATE",
          "Anomalies": "ANOMALY,ALERT",
          "System": "SYSTEM",
          "Errors": "ERROR"
        }
        const allowedBadges = selectedTypes.flatMap(t => (badgeMapping[t] || "").split(","))
        if (!allowedBadges.includes(event.badge)) return false
      }

      // 3. Actor dropdown
      if (selectedActor !== "All Actors") {
        if (selectedActor === "Users only" && event.actor.type !== "user") return false
        if (selectedActor === "System only" && event.actor.type !== "system") return false
        if (["Aria", "Nova", "Echo", "Flux"].includes(selectedActor) && event.actor.name !== selectedActor) return false
      }

      // 4. Entity type dropdown
      if (selectedEntity !== "All") {
        const lowerEntity = event.entity.toLowerCase()
        if (selectedEntity === "Tasks" && !lowerEntity.includes("task:")) return false
        if (selectedEntity === "Projects" && !lowerEntity.includes("project:")) return false
        if (selectedEntity === "Agents" && !lowerEntity.includes("agent:")) return false
        if (selectedEntity === "Billing" && !lowerEntity.includes("billing:")) return false
      }

      return true
    })
  }, [searchQuery, selectedTypes, selectedActor, selectedEntity])

  return (
    <PageTransition className="flex flex-col gap-6 relative h-[calc(100vh-80px)] overflow-hidden">
      
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Reality Stream
          </h1>
          <p className="text-[13px] text-[var(--foreground-2)]">
            Every action, every decision — immutable and live
          </p>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-forest-green/20 bg-forest-green/5 text-forest-green">
          <span className="status-pulse inline-block size-2 rounded-full bg-forest-green" />
          <span className="font-mono text-xs font-semibold tracking-wider">LIVE</span>
        </div>
      </div>

      {/* ── Two Panel Layout ── */}
      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        
        {/* LEFT PANEL: Filters (260px wide, fixed) */}
        <div className="w-[260px] shrink-0 hidden md:flex flex-col glass-panel rounded-xl p-5 justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold tracking-widest text-[var(--foreground-3)] uppercase">
                FILTERS
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--foreground-3)]" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] pl-9 pr-3 text-xs text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* Event Type Chips */}
            <div className="space-y-2">
              <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-3)]">
                Event Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["All", "Agent Actions", "User Actions", "Anomalies", "System", "Errors"].map((type) => {
                  const isSelected = selectedTypes.includes(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleTypeFilter(type)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium rounded-[6px] transition-all",
                        isSelected 
                          ? "bg-primary text-white" 
                          : "bg-[var(--surface-2)] border border-[var(--glass-border)] text-[var(--foreground-2)] hover:bg-[var(--surface-3)]"
                      )}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actor Dropdown */}
            <div className="space-y-1.5">
              <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-3)]">
                Actor
              </label>
              <select
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-2.5 text-xs text-foreground outline-none focus:border-primary"
              >
                <option>All Actors</option>
                <option>Aria</option>
                <option>Nova</option>
                <option>Echo</option>
                <option>Flux</option>
                <option>Users only</option>
                <option>System only</option>
              </select>
            </div>

            {/* Entity Type Dropdown */}
            <div className="space-y-1.5">
              <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-3)]">
                Entity Type
              </label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-2.5 text-xs text-foreground outline-none focus:border-primary"
              >
                <option>All</option>
                <option>Tasks</option>
                <option>Projects</option>
                <option>Agents</option>
                <option>Billing</option>
                <option>System</option>
              </select>
            </div>

            {/* Time range presets */}
            <div className="space-y-2">
              <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-3)]">
                Time Range
              </label>
              <div className="grid grid-cols-4 gap-1">
                {["1h", "24h", "7d", "30d"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeRange(t)}
                    className={cn(
                      "h-8 text-xs font-semibold rounded-md transition-all font-mono",
                      timeRange === t 
                        ? "bg-primary text-white" 
                        : "bg-[var(--surface-2)] text-[var(--foreground-2)] hover:bg-[var(--surface-3)]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="w-full py-2 border border-dashed border-[var(--glass-border)] rounded-lg text-xs font-semibold font-mono text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)] transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* RIGHT PANEL: Timeline List */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Timeline Header Row */}
          <div className="flex items-center justify-between mb-4 px-1 shrink-0">
            <span className="text-xs font-mono text-[var(--foreground-2)]">
              {filteredEvents.length} events
            </span>
            <div className="flex items-center gap-3">
              <button className="text-xs font-mono text-[var(--foreground-2)] hover:text-foreground flex items-center gap-1.5">
                ↓ Newest first
              </button>
              <button className="text-xs text-[var(--foreground-2)] hover:text-foreground">
                <Settings className="size-4" />
              </button>
            </div>
          </div>

          {/* Timeline Cards Container */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/10">
            {filteredEvents.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--foreground-3)] text-sm font-mono border border-dashed border-[var(--glass-border)] rounded-xl bg-[var(--surface-1)]">
                No events match query
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isAgent = evt.actor.type === "agent"
                const isUser = evt.actor.type === "user"
                const AvatarIcon = isAgent ? Bot : isUser ? User : Cpu

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={cn(
                      "cursor-pointer rounded-[10px] border bg-[var(--surface-1)] p-4 flex gap-4 transition-all hover:border-[var(--foreground-2)] border-y-[var(--glass-border)] border-r-[var(--glass-border)] border-l-4",
                      evt.borderClass,
                      selectedEvent?.id === evt.id ? "shadow-[0_0_12px_rgba(116,149,155,0.15)] bg-[var(--surface-2)] border-y-primary border-r-primary" : ""
                    )}
                  >
                    {/* Actor Avatar */}
                    <div className="size-8 rounded-full bg-[var(--surface-2)] border border-[var(--glass-border)] flex items-center justify-center shrink-0">
                      <AvatarIcon className="size-4 text-[var(--foreground-2)]" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top Row info */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{evt.actor.name}</span>
                          <span className="text-[var(--foreground-3)]">({evt.actor.role})</span>
                          <span className="font-mono bg-[var(--surface-2)] text-[10px] px-1.5 py-0.5 rounded text-primary border border-[var(--glass-border)]">
                            {evt.badge}
                          </span>
                        </div>
                        <span className="text-[var(--foreground-3)] font-mono">{evt.time}</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                        {evt.description}
                      </p>

                      {/* Entity Chip & View Link */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-[11px] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--glass-border)] text-[var(--foreground-2)]">
                          {evt.entity}
                        </span>
                        <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                          View <ArrowUpRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* ── Event Detail Slide-out Panel ── */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] glass-panel border-l border-[var(--glass-border)] bg-[var(--surface-1)] shadow-2xl p-6 flex flex-col justify-between"
          >
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-none">
              {/* Top controls */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] bg-[var(--surface-2)] px-2 py-0.5 rounded text-primary border border-[var(--glass-border)]">
                  {selectedEvent.badge}
                </span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)] transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Actor details */}
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-[var(--surface-2)] border border-[var(--glass-border)] flex items-center justify-center shrink-0">
                  {selectedEvent.actor.type === "agent" ? (
                    <Bot className="size-6 text-[hsl(var(--primary))]" />
                  ) : selectedEvent.actor.type === "user" ? (
                    <User className="size-6 text-[hsl(var(--secondary))]" />
                  ) : (
                    <Cpu className="size-6 text-[var(--foreground-2)]" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {selectedEvent.actor.name}
                  </h3>
                  <p className="text-xs text-[var(--foreground-2)]">
                    {selectedEvent.actor.role} · {selectedEvent.time}
                  </p>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <h4 className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider">
                  Description
                </h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Related Entity */}
              <div className="space-y-2">
                <h4 className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider">
                  Related Entity
                </h4>
                <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-2)] border border-[var(--glass-border)] rounded-lg">
                  <span className="font-mono text-xs text-foreground">
                    {selectedEvent.entity}
                  </span>
                  <a href="#" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                    Open <ArrowUpRight className="size-3" />
                  </a>
                </div>
              </div>

              {/* Monospace JSON Payload */}
              <div className="space-y-2 flex-1">
                <h4 className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider">
                  Payload
                </h4>
                <pre className="text-xs font-mono p-4 rounded-lg bg-[var(--surface-2)] text-[var(--foreground-2)] border border-[var(--glass-border)] overflow-x-auto">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageTransition>
  )
}

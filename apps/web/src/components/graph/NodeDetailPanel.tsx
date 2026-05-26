"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Bot, FolderKanban, Box, Award, Shield, Users, Layers, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface NodeDetailPanelProps {
  nodeData: any | null
  onClose: () => void
}

export function NodeDetailPanel({ nodeData, onClose }: NodeDetailPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"details" | "tasks" | "members" | "events">("details")

  React.useEffect(() => {
    // Reset tab when active node changes
    setActiveTab("details")
  }, [nodeData])

  if (!nodeData) return null

  const isProject = nodeData.type === "project"
  const isUser = nodeData.type === "user"
  const isAgent = nodeData.type === "agent"
  const isTask = nodeData.type === "task"

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="fixed bottom-0 right-0 top-[56px] z-40 w-full max-w-[380px] glass-panel border-l border-[var(--glass-border)] bg-[var(--surface-1)] shadow-2xl flex flex-col justify-between"
      >
        <div className="flex h-full flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
            <div className="flex items-center gap-2">
              <span className={cn(
                "size-2 rounded-full",
                isProject ? "bg-secondary" : isUser ? "bg-primary" : isTask ? "bg-amber" : "bg-foreground"
              )} />
              <span className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider">
                {nodeData.type} Node
              </span>
            </div>
            <button 
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)] transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Node Branding & Hero Info */}
          <div className="p-5 border-b border-[var(--glass-border)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--surface-2)] shadow-sm">
                {isUser && <User className="size-6 text-primary" />}
                {isProject && <FolderKanban className="size-6 text-secondary" />}
                {isTask && <Box className="size-6 text-amber" />}
                {isAgent && <Bot className="size-6 text-foreground" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {nodeData.name || nodeData.label}
                </h2>
                <p className="text-xs font-mono text-[var(--foreground-3)] mt-0.5">
                  ID: {nodeData.id}
                </p>
              </div>
            </div>

            {/* Custom Project Stats & Status Bar */}
            {isProject && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold tracking-wide bg-primary/10 text-primary uppercase">
                    IN PROGRESS
                  </span>
                  <span className="text-sm font-bold text-secondary font-mono">
                    Health: 94%
                  </span>
                </div>
                
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--glass-border)] text-center font-mono text-xs">
                  <div>
                    <p className="text-[var(--foreground-3)] uppercase text-[10px]">Tasks</p>
                    <p className="font-bold text-foreground mt-0.5">8</p>
                  </div>
                  <div>
                    <p className="text-[var(--foreground-3)] uppercase text-[10px]">Members</p>
                    <p className="font-bold text-foreground mt-0.5">3</p>
                  </div>
                  <div>
                    <p className="text-[var(--foreground-3)] uppercase text-[10px]">Agent</p>
                    <p className="font-bold text-primary mt-0.5">Flux</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs for details */}
            <div className="flex border-b border-[var(--glass-border)] text-xs font-semibold">
              {(["details", "tasks", "members", "events"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2 text-center border-b-2 capitalize transition-colors",
                    activeTab === tab 
                      ? "border-primary text-primary" 
                      : "border-transparent text-[var(--foreground-2)] hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Tab Panels */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-none">
            {activeTab === "details" && (
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider mb-1">
                    Description
                  </h4>
                  <p className="text-[var(--foreground-2)] leading-relaxed">
                    {isProject && "Refactor the core architecture of Sentient engine to optimize neural agent execution pipelines and reduce gateway routing latency."}
                    {isUser && "Primary administrator of the Sentient core organization environment. Active session."}
                    {isAgent && "Deployment agent responsible for automated continuous integration, pull request audits, and pipeline health monitoring."}
                    {isTask && "Analyze task dependencies and resolve core refactoring thread locks in memory management loops."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs">
                  <div>
                    <p className="text-[var(--foreground-3)] uppercase text-[10px]">Created</p>
                    <p className="text-foreground mt-0.5">Jan 15, 2026</p>
                  </div>
                  <div>
                    <p className="text-[var(--foreground-3)] uppercase text-[10px]">Priority</p>
                    <p className="text-amber font-semibold mt-0.5">High</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-2">
                <h4 className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider mb-2">
                  Active Tasks
                </h4>
                {[
                  { title: "Refactor core memory pipelines", status: "In Progress" },
                  { title: "JWT rotation keys", status: "Todo" },
                  { title: "Tailwind config v4 update", status: "Done" }
                ].map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--glass-border)] text-xs">
                    <span className="font-medium text-foreground truncate max-w-[180px]">{t.title}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded font-mono text-[10px] uppercase",
                      t.status === "Done" ? "bg-forest-green/10 text-forest-green" :
                      t.status === "In Progress" ? "bg-primary/10 text-primary" :
                      "bg-[var(--surface-3)] text-[var(--foreground-3)]"
                    )}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "members" && (
              <div className="space-y-3">
                <h4 className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider mb-2">
                  Team Members
                </h4>
                {[
                  { name: "Mohammad Habib", role: "Owner" },
                  { name: "Sarah Connor", role: "Developer" },
                  { name: "Flux Agent", role: "AI Assistant" }
                ].map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-bold text-primary border border-[var(--glass-border)]">
                      {m.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight">{m.name}</p>
                      <p className="text-[10px] text-[var(--foreground-3)] font-mono leading-none">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "events" && (
              <div className="space-y-3">
                <h4 className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider mb-2">
                  Event Ledger
                </h4>
                {[
                  { title: "Flux approvedoverride manual #102", time: "15m ago" },
                  { title: "Task reassigned to Sarah Connor", time: "18m ago" },
                  { title: "Created GitHub issue #284", time: "1h ago" }
                ].map((e, idx) => (
                  <div key={idx} className="flex items-start gap-2 border-l-2 border-primary pl-2.5 py-1 text-xs">
                    <div>
                      <p className="text-foreground leading-snug">{e.title}</p>
                      <p className="text-[10px] text-[var(--foreground-3)] font-mono mt-0.5">{e.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Footer */}
          <div className="p-4 border-t border-[var(--glass-border)]">
            <button className="w-full h-10 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-semibold text-foreground transition-all flex items-center justify-center gap-1.5 border border-[var(--glass-border)]">
              View Node Details in Stream &rarr;
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

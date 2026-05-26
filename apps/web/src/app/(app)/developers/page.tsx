"use client"

import * as React from "react"
import { Copy, ChevronDown, ChevronRight, Terminal, CheckCircle2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DevelopersOverviewPage() {
  const [responseExpanded, setResponseExpanded] = React.useState(false)

  const stats = [
    { label: "API Calls Today", value: "1,247", sub: "+12% vs yesterday", color: "text-forest-green" },
    { label: "Active Webhooks", value: "4", sub: "Healthy channels", color: "text-primary" },
    { label: "Installed Plugins", value: "3", sub: "Marketplace integrations", color: "text-primary" }
  ]

  const codeSnippet = `POST https://api.sentient.app/v1/tasks
Authorization: Bearer sk_live_••••••••••••4f2a

{
  "title": "Review Q3 roadmap",
  "projectId": "proj_abc123",
  "priority": "high"
}`

  const responseSnippet = `{
  "id": "task_xyz789",
  "title": "Review Q3 roadmap",
  "projectId": "proj_abc123",
  "status": "todo",
  "priority": "high",
  "agentAssigned": true,
  "createdAt": "2026-05-26T12:00:00Z"
}`

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet)
    toast.success("Code snippet copied to clipboard!")
  }

  const tableData = [
    { time: "Just now", method: "GET", endpoint: "/v1/tasks", status: 200, latency: "42ms" },
    { time: "2m ago", method: "POST", endpoint: "/v1/tasks", status: 201, latency: "112ms" },
    { time: "15m ago", method: "GET", endpoint: "/v1/projects", status: 200, latency: "38ms" },
    { time: "1h ago", method: "POST", endpoint: "/v1/webhooks", status: 500, latency: "240ms" },
    { time: "2h ago", method: "GET", endpoint: "/v1/agents", status: 200, latency: "45ms" }
  ]

  return (
    <div className="space-y-6">
  <div className="glass-panel rounded-xl p-8 mb-6 text-center bg-gradient-to-r from-primary/10 to-secondary/10">
    <h1 className="text-3xl font-bold text-foreground mb-2">Developer Portal</h1>
    <p className="text-sm text-[var(--foreground-2)]">Manage your API keys, webhooks, and explore the plugin marketplace.</p>
  </div>
      
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="glass-panel rounded-xl p-5 space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider">
              {stat.label}
            </span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-foreground font-mono">
                {stat.value}
              </span>
              <span className={cn("text-[10px] font-mono font-semibold uppercase", stat.color)}>
                {stat.sub}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Start Code Block ── */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Terminal className="size-4 text-primary" />
            Quick Start
          </h3>
          <button 
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)] transition-colors"
            title="Copy snippet"
          >
            <Copy className="size-4" />
          </button>
        </div>

        {/* Code Block */}
        <pre className="text-xs font-mono p-4 rounded-lg bg-[var(--surface-2)] text-[var(--foreground-2)] border border-[var(--glass-border)] overflow-x-auto">
          {codeSnippet}
        </pre>

        {/* Collapsible response preview */}
        <div className="border border-[var(--glass-border)] rounded-lg overflow-hidden">
          <button
            onClick={() => setResponseExpanded(!responseExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[var(--surface-2)] text-xs font-mono font-semibold text-[var(--foreground-2)] hover:text-foreground transition-all"
          >
            <span className="flex items-center gap-1">
              <ChevronRight className={cn("size-3.5 transition-transform", responseExpanded ? "rotate-90" : "")} />
              Response Preview
            </span>
            <span className="text-[10px] uppercase text-forest-green">201 created</span>
          </button>
          
          <AnimatePresence>
            {responseExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <pre className="text-xs font-mono p-4 bg-[var(--surface-3)] text-primary border-t border-[var(--glass-border)] overflow-x-auto">
                  {responseSnippet}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Recent API Activity Table ── */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground">
          Recent API Activity
        </h3>

        <div className="rounded-lg border border-[var(--glass-border)] overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--glass-border)] text-[var(--foreground-3)]">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5">Endpoint</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
               {tableData.map((row, idx) => {
                 const isError = row.status >= 400
                 const isPost = row.method === "POST"
                 
                 return (
                   <motion.tr
                     key={idx}
                     className="hover:bg-[var(--surface-2)]/40 transition-colors"
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.2, delay: idx * 0.05 }}
                   >
                     <td className="px-4 py-3 text-[var(--foreground-3)]">{row.time}</td>
                     <td className="px-4 py-3">
                       <span className={cn(
                         "font-bold",
                         isPost ? "text-primary" : "text-secondary"
                       )}
                       >
                         {row.method}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-foreground font-semibold">{row.endpoint}</td>
                     <td className="px-4 py-3">
                       <span className={cn(
                         "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                         isError ? "bg-red/10 text-red" : 
                         isPost ? "bg-primary/10 text-primary" : 
                         "bg-forest-green/10 text-forest-green"
                       )}
                       >
                         {row.status}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-right text-[var(--foreground-2)]">{row.latency}</td>
                   </motion.tr>
                 )
               })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

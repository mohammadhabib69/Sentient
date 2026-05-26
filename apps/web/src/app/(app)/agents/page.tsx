"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  useAgents, 
  usePendingActions, 
  useApproveAction, 
  useRejectAction 
} from "@/hooks/useAgents"
import { AgentCard } from "@/components/agents/AgentCard"
import { ApprovalCard } from "@/components/agents/ApprovalCard"
import { ShieldAlert, Users } from "lucide-react"

export default function AgentsPage() {
  const { data: agents = [], isLoading: loadingAgents } = useAgents()
  const { data: pendingActions = [], isLoading: loadingActions } = usePendingActions()
  
  const approveMutation = useApproveAction()
  const rejectMutation = useRejectAction()

  // Local optimistic state for toggle (usually hits an endpoint)
  const [localAgents, setLocalAgents] = React.useState(agents)

  React.useEffect(() => {
    if (agents.length > 0) setLocalAgents(agents)
  }, [agents])

  const handleToggle = (id: string, active: boolean) => {
    setLocalAgents(prev => prev.map(a => a.id === id ? { ...a, isActive: active } : a))
    // Note: Would typically call a mutation here like activateAgent(id)
  }

  const handleApprove = (id: string) => {
    approveMutation.mutate(id)
  }

  const handleReject = (id: string) => {
    rejectMutation.mutate(id)
  }

  return (
    <div className="flex h-full flex-col gap-10 pb-20">
      
      {/* ── Agent Fleet Section ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <Users className="size-5 text-[hsl(var(--primary))]" />
              Agent Fleet
            </h2>
            <p className="text-sm text-[var(--foreground-2)] mt-1">
              Manage your deployed AI agents and their operational status.
            </p>
          </div>
        </div>

        {loadingAgents ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[220px] animate-pulse rounded-xl bg-[var(--surface-2)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {localAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Pending Approvals Section ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <ShieldAlert className="size-5 text-[var(--amber)]" />
              Action Queue
            </h2>
            <p className="text-sm text-[var(--foreground-2)] mt-1">
              Agents have paused execution pending human review.
            </p>
          </div>
          {pendingActions.length > 0 && (
            <div className="flex size-7 items-center justify-center rounded-full bg-[var(--amber)]/20 text-xs font-bold text-[var(--amber)]">
              {pendingActions.length}
            </div>
          )}
        </div>

        <div className="min-h-[140px]">
          <AnimatePresence mode="popLayout">
            {pendingActions.length === 0 && !loadingActions ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--glass-border)] bg-[var(--surface-1)]"
              >
                <p className="text-sm text-[var(--foreground-3)]">No pending approvals required.</p>
              </motion.div>
            ) : (
              pendingActions.map((action) => (
                <ApprovalCard
                  key={action.id}
                  action={action}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={approveMutation.isPending || rejectMutation.isPending}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

    </div>
  )
}

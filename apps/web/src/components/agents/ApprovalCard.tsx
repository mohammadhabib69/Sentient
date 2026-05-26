"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, ShieldAlert, Check, X } from "lucide-react"
import { AgentAction } from "@/types/agent.types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ApprovalCardProps {
  action: AgentAction
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isProcessing?: boolean
}

export function ApprovalCard({ action, onApprove, onReject, isProcessing }: ApprovalCardProps) {
  const [timeLeft, setTimeLeft] = React.useState<string>("")

  // Simple expiry countdown
  React.useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const expiry = new Date(action.expiresAt).getTime()
      const diff = expiry - now
      
      if (diff <= 0) {
        setTimeLeft("Expired")
        return
      }

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }

    updateCountdown()
    const int = setInterval(updateCountdown, 1000)
    return () => clearInterval(int)
  }, [action.expiresAt])

  const riskColors = {
    low: "bg-green/10 text-green border-green/20",
    medium: "bg-amber/10 text-amber border-amber/20",
    high: "bg-red/10 text-red border-red/20",
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        borderColor: ["var(--glass-border)", "hsl(var(--amber))", "var(--glass-border)"],
      }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.9 }}
      transition={{ 
        opacity: { duration: 0.2 },
        height: { duration: 0.3 },
        borderColor: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      }}
      className="relative mb-4 flex flex-col overflow-hidden rounded-xl border-2 bg-[var(--surface-1)] shadow-sm"
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        
        {/* Left Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-[var(--amber)]" />
            <span className="text-sm font-semibold text-foreground">
              {action.agentName} <span className="text-[var(--foreground-3)] font-normal ml-1">requests approval</span>
            </span>
            <span className={cn(
              "ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              riskColors[action.riskLevel]
            )}>
              {action.riskLevel} risk
            </span>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-foreground">{action.actionType}</h3>
            <p className="mt-1 text-sm text-[var(--foreground-2)]">{action.description}</p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--amber)]">
            <Clock className="size-3.5" />
            <span>Expires in: {timeLeft}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          <Button 
            onClick={() => onApprove(action.id)} 
            disabled={isProcessing || timeLeft === 'Expired'}
            className="flex-1 bg-green hover:bg-green/90 text-white shadow-sm sm:flex-none"
          >
            <Check className="mr-1.5 size-4" />
            Approve
          </Button>
          <Button 
            variant="outline"
            onClick={() => onReject(action.id)} 
            disabled={isProcessing || timeLeft === 'Expired'}
            className="flex-1 border-red/30 text-red hover:bg-red/10 hover:text-red sm:flex-none"
          >
            <X className="mr-1.5 size-4" />
            Reject
          </Button>
        </div>
      </div>

      {/* Payload Data snippet (Glass styled bottom section) */}
      <div className="border-t border-[var(--glass-border)] bg-[var(--surface-2)]/50 px-5 py-3">
        <code className="text-xs text-[var(--foreground-3)]">
          Payload: {JSON.stringify(action.payload)}
        </code>
      </div>
    </motion.div>
  )
}

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Box, User, Bot, FolderKanban, Briefcase } from "lucide-react"

interface NodeDetailPanelProps {
  nodeData: any | null
  onClose: () => void
}

export function NodeDetailPanel({ nodeData, onClose }: NodeDetailPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="size-5 text-[hsl(var(--primary))]" />
      case 'agent': return <Bot className="size-5 text-[var(--amber)]" />
      case 'project': return <FolderKanban className="size-5 text-[hsl(var(--secondary))]" />
      case 'task': return <Box className="size-5 text-[var(--foreground-2)]" />
      default: return <Briefcase className="size-5 text-[var(--foreground-3)]" />
    }
  }

  return (
    <AnimatePresence>
      {nodeData && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 right-0 top-[56px] z-40 w-full max-w-sm border-l border-[var(--glass-border)] bg-[var(--surface-1)] shadow-2xl"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <h3 className="font-semibold text-foreground">Topology Node</h3>
              <button 
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--foreground-3)] transition-colors hover:bg-[var(--surface-2)] hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--surface-2)]">
                  {getIcon(nodeData.type)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{nodeData.label}</h2>
                  <p className="text-sm font-medium capitalize text-[var(--foreground-3)]">{nodeData.type}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[var(--glass-border)]">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-3)]">System ID</h4>
                  <p className="mt-1 font-mono text-sm text-[var(--foreground-2)]">{nodeData.id}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-3)]">Connected Edges</h4>
                  <p className="mt-1 text-sm text-[var(--foreground-2)]">This node acts as a bridge between {nodeData.type === 'workspace' ? 'projects and agents' : 'various entities'}.</p>
                </div>
              </div>

              {/* Action Button Placeholder */}
              <div className="pt-4">
                <button className="w-full rounded-lg bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-foreground hover:bg-[var(--surface-3)] transition-colors">
                  View Full Entity
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

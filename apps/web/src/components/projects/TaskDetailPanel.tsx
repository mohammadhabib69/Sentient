"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Task } from "@/types/task.types"
import { X, Calendar, User, Bot, AlertCircle } from "lucide-react"

interface TaskDetailPanelProps {
  task: Task | null
  onClose: () => void
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  return (
    <AnimatePresence>
      {task && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 right-0 top-[56px] z-50 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--surface-1)] shadow-2xl sm:w-96"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <h3 className="font-mono text-sm text-[var(--foreground-3)]">{task.id}</h3>
              <button 
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--foreground-3)] transition-colors hover:bg-[var(--surface-2)] hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              <div>
                <h2 className="text-xl font-bold text-foreground">{task.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--glass-border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold capitalize text-foreground">
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className="rounded-full border border-[var(--amber)]/30 bg-[var(--amber)]/10 px-2.5 py-1 text-xs font-semibold capitalize text-[var(--amber)]">
                    {task.priority} Priority
                  </span>
                </div>
              </div>

              {task.description && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-3)]">Description</h4>
                  <p className="text-sm leading-relaxed text-[var(--foreground-2)]">{task.description}</p>
                </div>
              )}

              <div className="space-y-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-2)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-3)]">
                    <User className="size-4" /> Assignee
                  </div>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-[var(--surface-3)]" />
                      <span className="text-sm font-medium text-foreground">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--foreground-3)]">Unassigned</span>
                  )}
                </div>

                {task.agentAssigned && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[var(--foreground-3)]">
                      <Bot className="size-4" /> AI Agent
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--secondary))]">
                      Active
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-3)]">
                    <Calendar className="size-4" /> Due Date
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                  </span>
                </div>
              </div>

              {task.status === 'blocked' && (
                <div className="rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-4">
                  <div className="flex items-center gap-2 text-[var(--red)]">
                    <AlertCircle className="size-5" />
                    <h4 className="font-semibold">Task Blocked</h4>
                  </div>
                  <p className="mt-2 text-sm text-[var(--red)]/80">
                    This task requires immediate attention or external dependencies to proceed.
                  </p>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { create } from "zustand";
import type { Agent, AgentAction } from "@/types/agent.types";

interface AgentState {
  agents: Agent[];
  pendingApprovals: AgentAction[];
  activeAgentId: string | null;
  setAgents: (agents: Agent[]) => void;
  addApproval: (action: AgentAction) => void;
  removeApproval: (actionId: string) => void;
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
  setActiveAgent: (id: string | null) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  pendingApprovals: [],
  activeAgentId: null,

  setAgents: (agents) => set({ agents }),

  addApproval: (action) =>
    set((state) => ({
      pendingApprovals: [...state.pendingApprovals, action],
    })),

  removeApproval: (actionId) =>
    set((state) => ({
      pendingApprovals: state.pendingApprovals.filter((a) => a.id !== actionId),
    })),

  approveAction: (actionId) =>
    set((state) => ({
      pendingApprovals: state.pendingApprovals.map((a) =>
        a.id === actionId ? { ...a, status: "approved" as const } : a,
      ),
    })),

  rejectAction: (actionId) =>
    set((state) => ({
      pendingApprovals: state.pendingApprovals.map((a) =>
        a.id === actionId ? { ...a, status: "rejected" as const } : a,
      ),
    })),

  setActiveAgent: (id) => set({ activeAgentId: id }),
}));

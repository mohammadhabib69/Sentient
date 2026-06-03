import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, AgentAction, AgentType } from "@/types/agent.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ListAgentsResponse {
  agents: Agent[];
}

interface ListPendingActionsResponse {
  actions: AgentAction[];
  total: number;
}

/** GET /v1/agents — list every agent for the org. */
export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async (): Promise<Agent[]> => {
      const res = await fetch(`${API_URL}/agents`, { credentials: "include" });
      const json = (await res.json()) as ApiResponse<ListAgentsResponse>;
      if (!json.success) throw new Error(json.error || "Failed to fetch agents");
      return json.data?.agents ?? [];
    },
    staleTime: 30000,
  });
}

/** GET /v1/agents/actions/pending — list pending approvals. */
export function usePendingActions() {
  return useQuery({
    queryKey: ["agent-actions", "pending"],
    queryFn: async (): Promise<AgentAction[]> => {
      const res = await fetch(`${API_URL}/agents/actions/pending`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<ListPendingActionsResponse>;
      if (!json.success) throw new Error(json.error || "Failed to fetch pending actions");
      return json.data?.actions ?? [];
    },
    staleTime: 10000,
  });
}

/** POST /v1/agents/actions/:id/approve */
export function useApproveAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: string) => {
      const res = await fetch(`${API_URL}/agents/actions/${actionId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<{ action: { id: string; status: string } }>;
      if (!json.success) throw new Error(json.error || "Failed to approve action");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-actions", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

/** POST /v1/agents/actions/:id/reject */
export function useRejectAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionId, reason }: { actionId: string; reason?: string }) => {
      const res = await fetch(`${API_URL}/agents/actions/${actionId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error || "Failed to reject action");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-actions", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

/** POST /v1/agents/run — manual agent trigger. */
export function useRunAgent() {
  return useMutation({
    mutationFn: async ({ agentType, prompt }: { agentType: AgentType; prompt: string }) => {
      const res = await fetch(`${API_URL}/agents/run`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType, prompt }),
      });
      const json = (await res.json()) as ApiResponse<{ jobId: string }>;
      if (!json.success) throw new Error(json.error || "Failed to enqueue agent run");
      return json.data;
    },
  });
}

/** POST /v1/agents/supervisor — multi-agent routing. */
export function useSupervisor() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch(`${API_URL}/agents/supervisor`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = (await res.json()) as ApiResponse<{ agents: string[]; reasoning: string }>;
      if (!json.success) throw new Error(json.error || "Supervisor failed");
      return json.data;
    },
  });
}

/** PATCH /v1/agents/:id/config — toggle approval mode etc. */
export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      approvalMode,
    }: {
      id: string;
      approvalMode?: "always" | "auto_low_risk" | "never";
    }) => {
      const res = await fetch(`${API_URL}/agents/${id}/config`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalMode }),
      });
      const json = (await res.json()) as ApiResponse<{ agent: Agent }>;
      if (!json.success) throw new Error(json.error || "Failed to update config");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

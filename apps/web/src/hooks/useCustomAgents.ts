import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SandboxTestResult {
  executionId: string;
  success: boolean;
  output: unknown;
  durationMs: number;
  error: string | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface CustomAgent {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  isActive: boolean;
  version: number;
  executionCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string };
}

export interface CustomAgentDetail extends CustomAgent {
  flowDefinition: { nodes: unknown[]; edges: unknown[] };
  compiledCode?: string;
  _count: { versions: number; executions: number };
}

export interface AgentRegistryItem {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  isBuiltin: boolean;
  isPublished?: boolean;
  executionCount: number;
  successRate: number;
  createdBy: string | null;
  createdAt: string;
}

// ─── LIST Custom Agents ────────────────────────────────────────────

export function useCustomAgents(params?: {
  filter?: "published" | "draft" | "all";
  cursor?: string;
}) {
  return useQuery({
    queryKey: ["custom-agents", params?.filter],
    queryFn: async (): Promise<{
      agents: CustomAgent[];
      nextCursor?: string;
      hasMore: boolean;
    }> => {
      const qs = new URLSearchParams();
      if (params?.filter) qs.set("filter", params.filter);
      if (params?.cursor) qs.set("cursor", params.cursor);

      const res = await fetch(`${API_URL}/agents/custom?${qs}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<{
        agents: CustomAgent[];
        nextCursor?: string;
        hasMore: boolean;
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to fetch custom agents");
      return json.data;
    },
    staleTime: 30000,
  });
}

// ─── GET One Custom Agent ──────────────────────────────────────────

export function useCustomAgent(id: string | undefined) {
  return useQuery({
    queryKey: ["custom-agent", id],
    queryFn: async (): Promise<CustomAgentDetail> => {
      const res = await fetch(`${API_URL}/agents/custom/${id}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<{
        agent: CustomAgentDetail;
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to fetch custom agent");
      return json.data.agent;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

// ─── CREATE Custom Agent ───────────────────────────────────────────

export function useCreateCustomAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      flowDefinition: { nodes: unknown[]; edges: unknown[] };
    }) => {
      const res = await fetch(`${API_URL}/agents/custom`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = (await res.json()) as ApiResponse<{
        id: string;
        name: string;
        version: number;
        isPublished: boolean;
        createdAt: string;
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to create custom agent");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent-registry"] });
    },
  });
}

// ─── UPDATE Custom Agent ───────────────────────────────────────────

export function useUpdateCustomAgent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name?: string;
      description?: string;
      flowDefinition?: { nodes: unknown[]; edges: unknown[] };
      changeNote?: string;
    }) => {
      const res = await fetch(`${API_URL}/agents/custom/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = (await res.json()) as ApiResponse<{ version: number }>;
      if (!json.success)
        throw new Error(json.error || "Failed to update custom agent");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-agent", id] });
      queryClient.invalidateQueries({ queryKey: ["custom-agents"] });
    },
  });
}

// ─── DELETE Custom Agent ───────────────────────────────────────────

export function useDeleteCustomAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/agents/custom/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success)
        throw new Error(json.error || "Failed to delete custom agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent-registry"] });
    },
  });
}

// ─── PUBLISH Custom Agent ──────────────────────────────────────────

export function usePublishCustomAgent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (version: number) => {
      const res = await fetch(`${API_URL}/agents/custom/${id}/publish`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      const json = (await res.json()) as ApiResponse<{
        id: string;
        version: number;
        publishedAt: string;
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to publish custom agent");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-agent", id] });
      queryClient.invalidateQueries({ queryKey: ["custom-agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent-registry"] });
    },
  });
}

// ─── TEST Custom Agent ─────────────────────────────────────────────

export function useTestCustomAgent(id: string) {
  return useMutation({
    mutationFn: async (params: {
      input: Record<string, unknown>;
      version?: number;
    }) => {
      const res = await fetch(`${API_URL}/agents/custom/${id}/test`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = (await res.json()) as ApiResponse<{
        executionId: string;
        success: boolean;
        output: unknown;
        durationMs: number;
        error: string | null;
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to test custom agent");
      return json.data;
    },
  });
}

// ─── VERSIONS ──────────────────────────────────────────────────────

export function useCustomAgentVersions(id: string | undefined) {
  return useQuery({
    queryKey: ["custom-agent-versions", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/agents/custom/${id}/versions`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<{
        versions: {
          id: string;
          version: number;
          flowDefinition: { nodes: unknown[]; edges: unknown[] };
          changeNote?: string;
          createdAt: string;
          createdBy: string;
        }[];
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to fetch versions");
      return json.data.versions;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

// ─── EXECUTIONS ────────────────────────────────────────────────────

export function useCustomAgentExecutions(
  id: string | undefined,
  params?: { status?: string },
) {
  return useQuery({
    queryKey: ["custom-agent-executions", id, params?.status],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);

      const res = await fetch(
        `${API_URL}/agents/custom/${id}/executions?${qs}`,
        { credentials: "include" },
      );
      const json = (await res.json()) as ApiResponse<{
        executions: {
          id: string;
          status: string;
          triggerType: string;
          proposedActions: number;
          errorMessage?: string;
          createdAt: string;
        }[];
        nextCursor?: string;
        hasMore: boolean;
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to fetch executions");
      return json.data;
    },
    enabled: !!id,
    staleTime: 10000,
  });
}

// ─── AGENT REGISTRY ────────────────────────────────────────────────

export function useAgentRegistry(params?: {
  filter?: "all" | "builtin" | "custom";
  search?: string;
}) {
  return useQuery({
    queryKey: ["agent-registry", params?.filter, params?.search],
    queryFn: async (): Promise<AgentRegistryItem[]> => {
      const qs = new URLSearchParams();
      if (params?.filter) qs.set("filter", params.filter);
      if (params?.search) qs.set("search", params.search);

      const res = await fetch(`${API_URL}/agents/registry?${qs}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<{
        agents: AgentRegistryItem[];
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to fetch registry");
      return json.data.agents;
    },
    staleTime: 60000,
  });
}

// ─── CLONE Custom Agent ────────────────────────────────────────────

export function useCloneCustomAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/agents/custom/${id}/clone`, {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<{
        id: string;
        name: string;
        version: number;
        isPublished: boolean;
        createdAt: string;
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to clone agent");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent-registry"] });
    },
  });
}

// ─── ROLLBACK Custom Agent ─────────────────────────────────────────

export function useRollbackCustomAgent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (version: number) => {
      const res = await fetch(
        `${API_URL}/agents/custom/${id}/rollback/${version}`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const json = (await res.json()) as ApiResponse<{
        id: string;
        version: number;
      }>;
      if (!json.success)
        throw new Error(json.error || "Failed to rollback agent");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-agent", id] });
      queryClient.invalidateQueries({ queryKey: ["custom-agent-versions", id] });
      queryClient.invalidateQueries({ queryKey: ["custom-agents"] });
    },
  });
}

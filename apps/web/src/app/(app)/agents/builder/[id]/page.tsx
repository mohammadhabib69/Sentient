"use client";

import { AgentBuilderCanvas } from "@/components/agents/AgentBuilderCanvas";
import { useCustomAgent } from "@/hooks/useCustomAgents";
import { useParams } from "next/navigation";
import { Node, Edge } from "@xyflow/react";

export default function EditAgentPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: agent, isLoading } = useCustomAgent(id);

  const initialFlow = agent?.flowDefinition
    ? {
        nodes: (agent.flowDefinition.nodes as any[]).map((n) => ({
          ...n,
          type: n.type as string,
        })) as Node[],
        edges: (agent.flowDefinition.edges as any[]).map((e) => ({
          ...e,
        })) as Edge[],
      }
    : undefined;

  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-3.5rem)] overflow-hidden bg-[var(--surface-1)]">
      {isLoading ? (
        <div className="flex items-center justify-center h-full text-[var(--foreground-3)]">
          Loading agent...
        </div>
      ) : (
        <AgentBuilderCanvas agentId={id} initialFlow={initialFlow} />
      )}
    </div>
  );
}

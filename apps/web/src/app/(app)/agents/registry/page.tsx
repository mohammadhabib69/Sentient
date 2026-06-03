"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useAgentRegistry,
  useCreateCustomAgent,
  useCloneCustomAgent,
  type AgentRegistryItem,
} from "@/hooks/useCustomAgents";
import { BookOpen, Search, Plus, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type FilterType = "all" | "builtin" | "custom";

export default function AgentRegistryPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: agents = [], isLoading } = useAgentRegistry({
    filter,
    search: searchTerm || undefined,
  });

  const createMutation = useCreateCustomAgent();
  const cloneMutation = useCloneCustomAgent();

  const handleClone = async (agent: AgentRegistryItem) => {
    if (agent.isBuiltin) return;
    try {
      const result = await cloneMutation.mutateAsync(agent.id);
      toast.success(`Cloned as "${result.name}"`);
      router.push(`/agents/builder/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clone agent");
    }
  };

  const handleView = (agent: AgentRegistryItem) => {
    if (agent.isBuiltin) {
      router.push(`/agents/${agent.id}`);
    } else {
      router.push(`/agents/builder/${agent.id}`);
    }
  };

  const handleCreateNew = () => {
    router.push("/agents/builder");
  };

  return (
    <div className="flex h-full flex-col gap-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BookOpen className="size-6 text-[hsl(var(--primary))]" />
            Agent Registry
          </h1>
          <p className="text-sm text-[var(--foreground-2)] mt-1">
            Browse and manage all agents — built-in and custom.
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="size-4" />
          New Agent
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--foreground-3)]" />
          <Input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "builtin", "custom"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "builtin" ? "Built-in" : "Custom"}
            </Button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-[200px] animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="size-12 text-[var(--foreground-3)] mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No agents found</h3>
          <p className="text-sm text-[var(--foreground-2)] mt-1">
            {searchTerm
              ? "Try a different search term"
              : "Create your first custom agent to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onView={handleView}
              onClone={handleClone}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  onView,
  onClone,
}: {
  agent: AgentRegistryItem;
  onView: (agent: AgentRegistryItem) => void;
  onClone: (agent: AgentRegistryItem) => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{agent.name}</CardTitle>
          <Badge variant={agent.isBuiltin ? "default" : agent.isPublished ? "default" : "secondary"}>
            {agent.isBuiltin ? "Built-in" : agent.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {agent.description ?? `${agent.type ?? "Custom"} agent`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 mt-auto">
        <div className="flex items-center gap-4 text-xs text-[var(--foreground-3)]">
          <span>
            Runs: {agent.executionCount.toLocaleString()}
          </span>
          <span>
            Success: {Math.round(agent.successRate * 100)}%
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onView(agent)}
          >
            <ExternalLink className="size-3.5" />
            View
          </Button>
          {!agent.isBuiltin && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onClone(agent)}
            >
              <Copy className="size-3.5" />
              Clone
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

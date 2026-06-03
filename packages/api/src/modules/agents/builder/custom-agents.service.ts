/**
 * Custom agent service (Phase 9 §8).
 *
 * Read/write data access for custom agents — CRUD, versioning, publish,
 * test, execution logs, and the combined registry endpoint.
 * All queries are org-scoped to enforce multi-tenant isolation.
 */
import { prisma } from "../../../config/prisma.js";
import { compileFlow, type CompiledAgent } from "./compiler.js";
import { runSandbox, type SandboxResult } from "./sandbox.js";
import { createPendingAction } from "../hitl.service.js";
import { env } from "../../../config/env.js";
import { NotFoundError, AppError } from "../../../utils/errors.js";
import { eventsService } from "../../events/events.service.js";
import { ActorType } from "@prisma/client";

// ─── Type aliases for Prisma-generated types ───────────────────────

interface FlowDefinition {
  nodes: unknown[];
  edges: unknown[];
}

// ─── CREATE ────────────────────────────────────────────────────────

export async function createCustomAgent(params: {
  orgId: string;
  userId: string;
  name: string;
  description?: string;
  flowDefinition: FlowDefinition;
}) {
  const { orgId, userId, name, description, flowDefinition } = params;

  // Validate max nodes
  const nodeCount = flowDefinition.nodes?.length ?? 0;
  if (nodeCount > env.AGENT_BUILDER_MAX_NODES) {
    throw new AppError(
      `Flow exceeds maximum node count (${env.AGENT_BUILDER_MAX_NODES})`,
      400,
      "FLOW_TOO_LARGE" as any,
    );
  }

  // Compile the flow to validate and generate code
  const compiled = compileFlow(
    flowDefinition.nodes as any,
    flowDefinition.edges as any,
  );

  return prisma.$transaction(async (tx) => {
    const agent = await tx.customAgent.create({
      data: {
        orgId,
        createdBy: userId,
        name,
        description,
        flowDefinition: flowDefinition as any,
        compiledCode: compiled.code || null,
        version: 1,
      },
    });

    // Create initial version
    await tx.customAgentVersion.create({
      data: {
        customAgentId: agent.id,
        version: 1,
        flowDefinition: flowDefinition as any,
        compiledCode: compiled.code || null,
        changeNote: "Initial version",
        createdBy: userId,
      },
    });

    return agent;
  });
}

// ─── LIST ──────────────────────────────────────────────────────────

export async function listCustomAgents(
  orgId: string,
  params: {
    limit?: number;
    cursor?: string;
    filter?: "published" | "draft" | "all";
  } = {},
) {
  const { limit = 20, cursor, filter = "all" } = params;

  const where: Record<string, unknown> = { orgId };
  if (filter === "published") where.isPublished = true;
  if (filter === "draft") where.isPublished = false;

  const agents = await prisma.customAgent.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      name: true,
      description: true,
      isPublished: true,
      isActive: true,
      version: true,
      executionCount: true,
      successCount: true,
      failureCount: true,
      createdAt: true,
      updatedAt: true,
      creator: { select: { id: true, name: true } },
    },
  });

  let nextCursor: string | undefined;
  if (agents.length > limit) {
    const nextItem = agents.pop();
    nextCursor = nextItem!.id;
  }

  const data = agents.map((a: { id: string; name: string; description: string | null; isPublished: boolean; isActive: boolean; version: number; executionCount: bigint; successCount: bigint; failureCount: bigint; createdAt: Date; updatedAt: Date; creator: { id: string; name: string } | null }) => ({
    ...a,
    executionCount: Number(a.executionCount),
    successRate:
      Number(a.successCount) + Number(a.failureCount) > 0
        ? Number(a.successCount) /
          (Number(a.successCount) + Number(a.failureCount))
        : 0,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return { agents: data, nextCursor, hasMore: !!nextCursor };
}

// ─── GET ONE ───────────────────────────────────────────────────────

export async function getCustomAgent(orgId: string, agentId: string) {
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      _count: { select: { versions: true, executions: true } },
    },
  });
  if (!agent) throw new NotFoundError("Custom agent");
  return agent;
}

// ─── UPDATE (creates new version) ──────────────────────────────────

export async function updateCustomAgent(
  orgId: string,
  agentId: string,
  userId: string,
  params: {
    name?: string;
    description?: string;
    flowDefinition?: FlowDefinition;
    changeNote?: string;
  },
) {
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
  });
  if (!agent) throw new NotFoundError("Custom agent");

  // Owner-only: only the creator can edit
  if (agent.createdBy !== userId) {
    throw new AppError(
      "Only the creator can edit this agent",
      403,
      "NOT_OWNER" as any,
    );
  }

  const newVersion = agent.version + 1;
  const flowDef = params.flowDefinition ?? agent.flowDefinition;

  // Validate max nodes
  const nodeCount = (flowDef as any).nodes?.length ?? 0;
  if (nodeCount > env.AGENT_BUILDER_MAX_NODES) {
    throw new AppError(
      `Flow exceeds maximum node count (${env.AGENT_BUILDER_MAX_NODES})`,
      400,
      "FLOW_TOO_LARGE" as any,
    );
  }

  // Compile if flow changed
  let compiled: CompiledAgent | null = null;
  if (params.flowDefinition) {
    compiled = compileFlow(
      params.flowDefinition.nodes as any,
      params.flowDefinition.edges as any,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.customAgent.update({
      where: { id: agentId },
      data: {
        ...(params.name ? { name: params.name } : {}),
        ...(params.description !== undefined
          ? { description: params.description }
          : {}),
        ...(params.flowDefinition
          ? {
              flowDefinition: params.flowDefinition as any,
              compiledCode: compiled?.code ?? null,
            }
          : {}),
        version: newVersion,
      },
    });

    // Create version record
    await tx.customAgentVersion.create({
      data: {
        customAgentId: agentId,
        version: newVersion,
        flowDefinition: flowDef as any,
        compiledCode: compiled?.code ?? (agent.compiledCode as any) ?? null,
        changeNote: params.changeNote ?? `Version ${newVersion}`,
        createdBy: userId,
      },
    });

    return { ...updated, newVersion };
  });
}

// ─── DELETE ────────────────────────────────────────────────────────

export async function deleteCustomAgent(orgId: string, agentId: string) {
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
  });
  if (!agent) throw new NotFoundError("Custom agent");

  return prisma.customAgent.delete({ where: { id: agentId } });
}

// ─── VERSIONS ──────────────────────────────────────────────────────

export async function listVersions(orgId: string, agentId: string) {
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) throw new NotFoundError("Custom agent");

  return prisma.customAgentVersion.findMany({
    where: { customAgentId: agentId },
    orderBy: [{ version: "desc" }],
  });
}

export async function getVersion(
  orgId: string,
  agentId: string,
  version: number,
) {
  const ver = await prisma.customAgentVersion.findFirst({
    where: { customAgentId: agentId, version },
  });
  if (!ver) throw new NotFoundError("Version");

  // Verify ownership
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) throw new NotFoundError("Custom agent");

  return ver;
}

// ─── ROLLBACK — revert to a previous version ───────────────────────

export async function rollbackToVersion(
  orgId: string,
  agentId: string,
  userId: string,
  version: number,
) {
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
  });
  if (!agent) throw new NotFoundError("Custom agent");
  if (agent.createdBy !== userId) {
    throw new AppError(
      "Only the creator can rollback this agent",
      403,
      "NOT_OWNER" as any,
    );
  }

  const ver = await prisma.customAgentVersion.findFirst({
    where: { customAgentId: agentId, version },
  });
  if (!ver) throw new NotFoundError(`Version ${version}`);

  const newVersion = agent.version + 1;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.customAgent.update({
      where: { id: agentId },
      data: {
        flowDefinition: ver.flowDefinition as any,
        compiledCode: ver.compiledCode as any,
        version: newVersion,
      },
    });

    await tx.customAgentVersion.create({
      data: {
        customAgentId: agentId,
        version: newVersion,
        flowDefinition: ver.flowDefinition as any,
        compiledCode: ver.compiledCode as any,
        changeNote: `Rolled back to version ${version}`,
        createdBy: userId,
      },
    });

    return updated;
  });
}

// ─── CLONE — create a copy of an existing agent ────────────────────

export async function cloneCustomAgent(
  orgId: string,
  agentId: string,
  userId: string,
) {
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
  });
  if (!agent) throw new NotFoundError("Custom agent");

  return prisma.$transaction(async (tx) => {
    const cloned = await tx.customAgent.create({
      data: {
        orgId,
        createdBy: userId,
        name: `${agent.name} (Copy)`,
        description: agent.description,
        flowDefinition: agent.flowDefinition as any,
        compiledCode: agent.compiledCode as any,
        version: 1,
        isPublished: false,
        isActive: true,
      },
    });

    await tx.customAgentVersion.create({
      data: {
        customAgentId: cloned.id,
        version: 1,
        flowDefinition: agent.flowDefinition as any,
        compiledCode: agent.compiledCode as any,
        changeNote: "Cloned from existing agent",
        createdBy: userId,
      },
    });

    return cloned;
  });
}

// ─── PUBLISH ───────────────────────────────────────────────────────

export async function publishCustomAgent(
  orgId: string,
  agentId: string,
  userId: string,
  version: number,
) {
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
    include: {
      versions: {
        where: { version },
        select: { flowDefinition: true, compiledCode: true },
      },
    },
  });
  if (!agent) throw new NotFoundError("Custom agent");

  const ver = agent.versions[0];
  if (!ver) throw new NotFoundError(`Version ${version}`);

  // Compile the flow to ensure it's valid
  const compiled = compileFlow(
    (ver.flowDefinition as any).nodes,
    (ver.flowDefinition as any).edges,
  );
  if (compiled.errors.filter((e) => e.severity === "error").length > 0) {
    throw new AppError(
      `Cannot publish: flow has compilation errors`,
      400,
      "FLOW_ERRORS" as any,
      compiled.errors,
    );
  }

  // Check approval requirement
  if (env.AGENT_BUILDER_PUBLISH_REQUIRES_APPROVAL) {
    const user = await prisma.user.findFirst({
      where: { id: userId, orgId },
      select: { role: true },
    });
    if (!user || user.role !== "ORG_ADMIN") {
      throw new AppError(
        "Publishing requires org admin approval",
        403,
        "REQUIRES_APPROVAL" as any,
      );
    }
  }

  return prisma.customAgent.update({
    where: { id: agentId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
      publishedBy: userId,
      compiledCode: compiled.code,
    },
  });
}

// ─── TEST (sandbox) ────────────────────────────────────────────────

export async function testCustomAgent(
  orgId: string,
  agentId: string,
  userId: string,
  params: {
    input?: Record<string, unknown>;
    version?: number;
  },
): Promise<{
  executionId: string;
  success: boolean;
  output: unknown;
  duration: number;
  error: string | null;
}> {
  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
  });
  if (!agent) throw new NotFoundError("Custom agent");

  // Use specific version or latest
  const ver = await prisma.customAgentVersion.findFirst({
    where: {
      customAgentId: agentId,
      ...(params.version ? { version: params.version } : {}),
    },
    orderBy: [{ version: "desc" }],
  });
  if (!ver) throw new NotFoundError("Version not found");

  const flowDef = ver.flowDefinition as any;
  const compiled = compileFlow(flowDef.nodes, flowDef.edges);
  if (compiled.errors.filter((e) => e.severity === "error").length > 0) {
    throw new AppError(
      `Flow has compilation errors: ${compiled.errors.map((e) => e.message).join("; ")}`,
      400,
      "FLOW_ERRORS" as any,
    );
  }

  // Create execution record
  const execution = await prisma.customAgentExecution.create({
    data: {
      customAgentId: agentId,
      orgId,
      triggeredBy: userId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
      input: (params.input ?? {}) as any,
    },
  });

  // Build action tools map (stub — in production these resolve to real executors)
  const tools: Record<string, Function> = {};

  // Run in sandbox
  const result: SandboxResult = await runSandbox({
    code: compiled.code,
    input: params.input ?? {},
    orgId,
    tools,
  });

  // Update execution record
  const updated = await prisma.customAgentExecution.update({
    where: { id: execution.id },
    data: {
      status: result.success ? "success" : "failed",
      completedAt: new Date(),
      output: (result.output ?? {}) as any,
      proposedActions: Array.isArray(
        (result.output as any)?.proposedActions,
      )
        ? (result.output as any).proposedActions.length
        : 0,
      errorMessage: result.error,
    },
  });

  return {
    executionId: updated.id,
    success: result.success,
    output: result.output,
    duration: result.duration,
    error: result.error,
  };
}

// ─── EXECUTIONS ────────────────────────────────────────────────────

export async function listExecutions(
  orgId: string,
  agentId: string,
  params: {
    limit?: number;
    cursor?: string;
    status?: string;
  } = {},
) {
  const { limit = 20, cursor, status } = params;

  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) throw new NotFoundError("Custom agent");

  const where: Record<string, unknown> = { customAgentId: agentId };
  if (status) where.status = status;

  const executions = await prisma.customAgentExecution.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  let nextCursor: string | undefined;
  if (executions.length > limit) {
    const nextItem = executions.pop();
    nextCursor = nextItem!.id;
  }

  return {
    executions: executions.map((e: { id: string; customAgentId: string; orgId: string; triggeredBy: string; triggerType: string; status: string; input: unknown; output: unknown; proposedActions: number; errorMessage: string | null; errorStack: string | null; startedAt: Date | null; completedAt: Date | null; createdAt: Date }) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
    nextCursor,
    hasMore: !!nextCursor,
  };
}

// ─── REGISTRY (built-in + custom) ──────────────────────────────────

export async function getAgentRegistry(
  orgId: string,
  params: {
    filter?: "all" | "builtin" | "custom";
    search?: string;
    limit?: number;
  } = {},
) {
  const { filter = "all", search, limit = 50 } = params;

  const agents: any[] = [];

  // Built-in agents
  if (filter === "all" || filter === "builtin") {
    const builtins = await prisma.agent.findMany({
      where: {
        orgId,
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: "asc" }],
      take: limit,
    });

    for (const a of builtins) {
      const rm = await prisma.agentReadModel.findFirst({
        where: { orgId, id: a.id },
      });
      agents.push({
        id: a.id,
        name: a.name,
        type: a.type,
        description: null,
        isBuiltin: true,
        executionCount: Number(a.actionsCount ?? rm?.totalActionsAllTime ?? 0),
        successRate: rm
          ? Number(rm.successRate) / 100
          : 1,
        createdBy: null,
        createdAt: a.createdAt.toISOString(),
      });
    }
  }

  // Custom agents
  if (filter === "all" || filter === "custom") {
    const custom = await prisma.customAgent.findMany({
      where: {
        orgId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    for (const a of custom) {
      agents.push({
        id: a.id,
        name: a.name,
        type: null,
        description: a.description,
        isBuiltin: false,
        isPublished: a.isPublished,
        executionCount: Number(a.executionCount),
        successRate:
          Number(a.successCount) + Number(a.failureCount) > 0
            ? Number(a.successCount) /
              (Number(a.successCount) + Number(a.failureCount))
            : 0,
        createdBy: a.creator?.name ?? null,
        createdAt: a.createdAt.toISOString(),
      });
    }
  }

  return { agents };
}

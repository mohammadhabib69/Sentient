/**
 * Agents service (Phase 8 §13).
 *
 * Read-side data shaping for the agent API. All org scoping is
 * enforced at the Prisma query level — never trust the caller's
 * `:id` alone; always include `orgId` in the `where` clause.
 */
import { AgentActionStatus, ApprovalMode } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { aiQueue } from "../../jobs/queues.js";
import { clearMemory, listMemory } from "./embedding.service.js";
import { runSupervisor } from "./supervisor.agent.js";
import { approveAction, rejectAction } from "./hitl.service.js";
import { NotFoundError } from "../../utils/errors.js";

export interface AgentListItem {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  approvalMode: string;
  actionsCount: number;
  actionsToday: number;
  pendingApprovals: number;
  lastActionAt: string | null;
  description: string | null;
}

/** GET /v1/agents — list every agent for the org with live read-model stats. */
export async function listAgents(orgId: string): Promise<AgentListItem[]> {
  const agents = await prisma.agent.findMany({
    where: { orgId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  if (agents.length === 0) return [];

  // Pull the read-model stats in one query.
  const readModels = await prisma.agentReadModel.findMany({
    where: { orgId, id: { in: agents.map((a) => a.id) } },
  });
  const readMap = new Map(readModels.map((r) => [r.id, r]));

  // Pending approvals per agent — counts agent_actions with status=pending.
  const pendingCounts = await prisma.agentAction.groupBy({
    by: ["agentId"],
    where: { orgId, status: AgentActionStatus.PENDING },
    _count: { agentId: true },
  });
  const pendingMap = new Map(pendingCounts.map((p) => [p.agentId, p._count.agentId]));

  return agents.map((a) => {
    const rm = readMap.get(a.id);
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      isActive: a.isActive,
      approvalMode: a.approvalMode,
      actionsCount: Number(a.actionsCount ?? rm?.totalActionsAllTime ?? 0),
      actionsToday: rm?.actionsToday ?? 0,
      pendingApprovals: pendingMap.get(a.id) ?? rm?.pendingApprovals ?? 0,
      lastActionAt: rm?.lastActionAt ? rm.lastActionAt.toISOString() : null,
      description: null,
    };
  });
}

/** GET /v1/agents/:id — single agent detail. */
export async function getAgent(orgId: string, agentId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    include: {
      _count: { select: { actions: true, memories: true } },
    },
  });
  if (!agent) throw new NotFoundError("Agent");
  return agent;
}

/** GET /v1/agents/:id/actions — list of actions for an agent. */
export async function listAgentActions(
  orgId: string,
  agentId: string,
  limit = 50,
) {
  return prisma.agentAction.findMany({
    where: { orgId, agentId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** GET /v1/agents/actions/pending — pending approvals org-wide. */
export async function listPendingActions(orgId: string, limit = 50) {
  return prisma.agentAction.findMany({
    where: { orgId, status: AgentActionStatus.PENDING },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { agent: { select: { id: true, name: true, type: true } } },
  });
}

/** GET /v1/agents/actions/:id — single action detail. */
export async function getAction(orgId: string, actionId: string) {
  const action = await prisma.agentAction.findFirst({
    where: { id: actionId, orgId },
    include: {
      agent: { select: { id: true, name: true, type: true } },
    },
  });
  if (!action) throw new NotFoundError("Agent action");
  return action;
}

/** GET /v1/agents/:id/memory — list memory entries for an agent namespace. */
export async function listAgentMemory(
  orgId: string,
  agentId: string,
  namespace: string,
  limit: number,
) {
  // Verify the agent belongs to this org.
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true, memoryNs: true },
  });
  if (!agent) throw new NotFoundError("Agent");
  const ns = namespace === "default" ? agent.memoryNs : namespace;
  return listMemory(agentId, ns, limit);
}

/** DELETE /v1/agents/:id/memory — clear a namespace. */
export async function clearAgentMemory(
  orgId: string,
  agentId: string,
  namespace: string,
) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true, memoryNs: true },
  });
  if (!agent) throw new NotFoundError("Agent");
  const ns = namespace === "default" ? agent.memoryNs : namespace;
  const result = await clearMemory(agentId, ns);
  return { deletedCount: (result as any)?.count ?? 0 };
}

/** POST /v1/agents/:id/activate — flip isActive=true. */
export async function activateAgent(orgId: string, agentId: string) {
  const agent = await prisma.agent.findFirst({ where: { id: agentId, orgId } });
  if (!agent) throw new NotFoundError("Agent");
  return prisma.agent.update({
    where: { id: agentId },
    data: { isActive: true },
  });
}

/** POST /v1/agents/:id/deactivate — flip isActive=false. */
export async function deactivateAgent(orgId: string, agentId: string) {
  const agent = await prisma.agent.findFirst({ where: { id: agentId, orgId } });
  if (!agent) throw new NotFoundError("Agent");
  return prisma.agent.update({
    where: { id: agentId },
    data: { isActive: false },
  });
}

/** PATCH /v1/agents/:id/config — update approvalMode / config JSON. */
export async function updateAgentConfig(
  orgId: string,
  agentId: string,
  patch: {
    approvalMode?: "always" | "auto_low_risk" | "never";
    config?: Record<string, unknown>;
  },
) {
  const agent = await prisma.agent.findFirst({ where: { id: agentId, orgId } });
  if (!agent) throw new NotFoundError("Agent");
  const approvalModeEnum =
    patch.approvalMode === "always"
      ? ApprovalMode.ALWAYS
      : patch.approvalMode === "auto_low_risk"
        ? ApprovalMode.AUTO_LOW_RISK
        : patch.approvalMode === "never"
          ? ApprovalMode.NEVER
          : undefined;
  return prisma.agent.update({
    where: { id: agentId },
    data: {
      ...(approvalModeEnum ? { approvalMode: approvalModeEnum } : {}),
      ...(patch.config
        ? {
            config: {
              ...((agent.config as object) ?? {}),
              ...patch.config,
            } as any,
          }
        : {}),
    },
  });
}

/** POST /v1/agents/run — manually enqueue an agent job. */
export async function enqueueAgentRun(params: {
  orgId: string;
  agentType: string;
  prompt: string;
}) {
  const agent = await prisma.agent.findFirst({
    where: {
      orgId: params.orgId,
      type: params.agentType as any,
      isActive: true,
    },
  });
  if (!agent) {
    throw new NotFoundError("No active agent of the requested type");
  }
  const job = await aiQueue.add("run-agent", {
    orgId: params.orgId,
    agentId: agent.id,
    agentName: agent.name,
    agentType: agent.type,
    prompt: params.prompt,
  });
  return { jobId: String(job.id) };
}

/** POST /v1/agents/supervisor — route prompt via the multi-agent supervisor. */
export async function runSupervisorRoute(orgId: string, prompt: string) {
  return runSupervisor({ orgId, prompt });
}

/** Approve / reject delegates to the HITL service. */
export function approvePendingAction(
  orgId: string,
  actionId: string,
  userId: string,
) {
  return approveAction(actionId, userId, orgId);
}
export function rejectPendingAction(
  orgId: string,
  actionId: string,
  userId: string,
  reason?: string,
) {
  return rejectAction(actionId, userId, orgId, reason);
}

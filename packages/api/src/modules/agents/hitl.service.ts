/**
 * Human-in-the-Loop (HITL) service (Phase 8 §5).
 *
 * The trust model: no agent action is executed without a human
 * approving it, unless the agent is configured with
 * `approvalMode = 'auto_low_risk'` AND the action is `low` risk AND
 * the agent's confidence is above `AGENT_AUTO_APPROVE_THRESHOLD`.
 *
 * `createPendingAction()` returns the new action's id. The caller
 * (BullMQ worker, supervisor, manual trigger) doesn't have to wait
 * for approval — execution is dispatched asynchronously when a
 * human approves via the REST API.
 */
import { AgentActionStatus, ApprovalMode, ActorType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { eventsService } from "../events/events.service.js";
import { emitToOrg } from "../../websocket/events.js";
import { env } from "../../config/env.js";
import { AppError, NotFoundError } from "../../utils/errors.js";
import { dispatchActionExecution } from "./action.executor.js";

export interface CreatePendingActionParams {
  agentId: string;
  orgId: string;
  actionType: string;
  description: string;
  payload: Record<string, unknown>;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  expiresInHours?: number;
}

/** Create a pending action requiring human approval. Returns the action id. */
export async function createPendingAction(
  params: CreatePendingActionParams,
): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setHours(
    expiresAt.getHours() +
      (params.expiresInHours ?? env.AGENT_APPROVAL_TIMEOUT_HOURS),
  );

  const agent = await prisma.agent.findFirst({ where: { id: params.agentId } });
  if (!agent) {
    throw new NotFoundError("Agent");
  }

  // Skip human approval if disabled in env (testing only) or if the
  // agent is configured for auto-approval and the action is low risk.
  const autoApprove =
    env.HITL_ENABLED &&
    agent.approvalMode === ApprovalMode.AUTO_LOW_RISK &&
    params.riskLevel === "low" &&
    params.confidence >= env.AGENT_AUTO_APPROVE_THRESHOLD;

  const action = await prisma.agentAction.create({
    data: {
      agentId: params.agentId,
      orgId: params.orgId,
      actionType: params.actionType,
      description: params.description,
      payload: params.payload as any,
      status: autoApprove ? AgentActionStatus.APPROVED : AgentActionStatus.PENDING,
      riskLevel: params.riskLevel,
      confidence: params.confidence,
      approvedBy: autoApprove ? params.agentId : null,
      approvedAt: autoApprove ? new Date() : null,
      expiresAt,
    },
  });

  await eventsService.logEvent({
    orgId: params.orgId,
    type: "agent.action.created",
    aggregateId: action.id,
    aggregateType: "agent_action",
    payload: {
      agentId: params.agentId,
      agentName: agent.name,
      agentType: agent.type,
      actionType: params.actionType,
      description: params.description,
      riskLevel: params.riskLevel,
      confidence: params.confidence,
      autoApproved: autoApprove,
    },
    actorId: params.agentId,
    actorType: ActorType.AGENT,
  });

  if (autoApprove) {
    // Execute immediately — fire-and-forget so the caller isn't blocked.
    void executeAction(action.id, params.orgId);
  } else {
    // Tell the org room a new approval is waiting (sidebar badge, etc.).
    emitToOrg(params.orgId, "agent:action_pending", {
      action: {
        id: action.id,
        agentId: params.agentId,
        agentName: agent.name,
        actionType: params.actionType,
        description: params.description,
        riskLevel: params.riskLevel,
        expiresAt: expiresAt.toISOString(),
        createdAt: action.createdAt.toISOString(),
      },
    });
  }

  return action.id;
}

/** Approve a pending action. Triggers execution. */
export async function approveAction(
  actionId: string,
  approvedBy: string,
  orgId: string,
): Promise<void> {
  const action = await prisma.agentAction.findFirst({
    where: { id: actionId, orgId, status: AgentActionStatus.PENDING },
  });
  if (!action) throw new NotFoundError("Agent action");

  if (action.expiresAt && action.expiresAt < new Date()) {
    await prisma.agentAction.update({
      where: { id: actionId },
      data: { status: AgentActionStatus.FAILED, result: { error: "Action expired before approval" } as any },
    });
    throw new AppError("This action has expired", 410, "ACTION_EXPIRED" as any);
  }

  await prisma.agentAction.update({
    where: { id: actionId },
    data: { status: AgentActionStatus.APPROVED, approvedBy, approvedAt: new Date() },
  });

  await eventsService.logEvent({
    orgId,
    type: "agent.action.approved",
    aggregateId: actionId,
    aggregateType: "agent_action",
    payload: { actionId, approvedBy },
    actorId: approvedBy,
    actorType: ActorType.USER,
  });

  // Execute the action. Awaited so the API caller can return the result
  // directly when the execution is synchronous (most executors are).
  await executeAction(actionId, orgId);
}

/** Reject a pending action. */
export async function rejectAction(
  actionId: string,
  rejectedBy: string,
  orgId: string,
  reason?: string,
): Promise<void> {
  const action = await prisma.agentAction.findFirst({
    where: { id: actionId, orgId, status: AgentActionStatus.PENDING },
  });
  if (!action) throw new NotFoundError("Agent action");

  await prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status: AgentActionStatus.REJECTED,
      result: { rejectedBy, reason } as any,
    },
  });

  await eventsService.logEvent({
    orgId,
    type: "agent.action.rejected",
    aggregateId: actionId,
    aggregateType: "agent_action",
    payload: { actionId, rejectedBy, reason },
    actorId: rejectedBy,
    actorType: ActorType.USER,
  });

  emitToOrg(orgId, "agent:action_rejected", { actionId, reason });
}

/**
 * Execute an approved action. Dispatches to the right executor based
 * on `actionType` (see `action.executor.ts`). Updates the row to
 * `executed` or `failed` and emits the corresponding event + socket.
 */
export async function executeAction(
  actionId: string,
  orgId: string,
): Promise<Record<string, unknown> | undefined> {
  const action = await prisma.agentAction.findFirst({
    where: { id: actionId, orgId },
    include: { agent: true },
  });
  if (!action) return undefined;

  try {
    const result = await dispatchActionExecution(action);

    await prisma.agentAction.update({
      where: { id: actionId },
      data: { status: AgentActionStatus.EXECUTED, executedAt: new Date(), result: result as any },
    });

    await eventsService.logEvent({
      orgId,
      type: "agent.action.executed",
      aggregateId: actionId,
      aggregateType: "agent_action",
      payload: { actionId, actionType: action.actionType, result },
      actorId: action.agentId,
      actorType: ActorType.AGENT,
    });

    emitToOrg(orgId, "agent:action_executed", { actionId, result });

    // Increment the agent's all-time action counter so the read model
    // projector can surface it.
    await prisma.agent.update({
      where: { id: action.agentId },
      data: { actionsCount: { increment: 1 } },
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.agentAction.update({
      where: { id: actionId },
      data: { status: AgentActionStatus.FAILED, result: { error: message } as any },
    });

    await eventsService.logEvent({
      orgId,
      type: "agent.action.failed",
      aggregateId: actionId,
      aggregateType: "agent_action",
      payload: { actionId, error: message },
      actorId: action.agentId,
      actorType: ActorType.AGENT,
    });

    throw err;
  }
}

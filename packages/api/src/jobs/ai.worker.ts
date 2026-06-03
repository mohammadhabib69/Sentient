/**
 * AI queue worker (Phase 8 §7).
 *
 * BullMQ worker that drains `ai-queue` jobs. Each job runs the
 * appropriate agent (Aria/Nova/Echo/Flux), then pushes every proposed
 * action into the HITL pipeline.
 */
import { Worker, type Job } from "bullmq";
import { bullRedisClient } from "../config/redis.js";
import { BaseAgent } from "../modules/agents/base.agent.js";
import { AriaAgent } from "../modules/agents/aria.agent.js";
import { NovaAgent } from "../modules/agents/nova.agent.js";
import { EchoAgent } from "../modules/agents/echo.agent.js";
import { FluxAgent } from "../modules/agents/flux.agent.js";
import { createPendingAction } from "../modules/agents/hitl.service.js";

const AGENT_INSTANCES: Record<string, BaseAgent> = {
  operations: new AriaAgent(),
  finance: new NovaAgent(),
  customer: new EchoAgent(),
  dev: new FluxAgent(),
};

export interface AgentJobData {
  orgId: string;
  agentId: string;
  agentName: string;
  agentType: string;
  prompt: string;
  triggerEventId?: string;
}

export const aiWorker = new Worker<AgentJobData>(
  "ai-queue",
  async (job: Job<AgentJobData>) => {
    const { orgId, agentId, agentName, agentType, prompt } = job.data;

    const agent = AGENT_INSTANCES[agentType];
    if (!agent) {
      throw new Error(`No agent implementation for type: ${agentType}`);
    }

    const ctx = { orgId, agentId, agentName, agentType };

    // Run the agent.
    const proposedActions = await agent.run(ctx, prompt);

    if (proposedActions.length === 0) {
      console.log(`[${agentName}] No actions proposed.`);
      return { proposed: 0 };
    }

    // Push each proposed action through the HITL pipeline.
    for (const action of proposedActions) {
      await createPendingAction({
        agentId,
        orgId,
        actionType: action.type,
        description: action.description,
        payload: { ...action.payload, orgId, agentId },
        riskLevel: action.riskLevel,
        confidence: action.confidence,
      });
    }

    return { proposed: proposedActions.length };
  },
  {
    connection: bullRedisClient,
    concurrency: 3, // Max 3 agent jobs at once
  },
);

aiWorker.on("failed", (job, err) => {
  console.error(`[AI Worker] Job ${job?.id} failed:`, err.message);
});

aiWorker.on("completed", (job, result) => {
  if (result && typeof result === "object" && "proposed" in result) {
    console.log(
      `[AI Worker] Job ${job.id} completed — proposed=${result.proposed}`,
    );
  }
});

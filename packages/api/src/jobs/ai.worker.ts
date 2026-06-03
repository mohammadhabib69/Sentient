/**
 * AI queue worker (Phase 8 §7 + Phase 9 custom agents).
 *
 * BullMQ worker that drains `ai-queue` jobs. Each job runs either:
 *   - A built-in agent (Aria/Nova/Echo/Flux) → HITL pipeline
 *   - A custom agent (compiled visual flow) → sandbox execution
 */
import { Worker, type Job } from "bullmq";
import { bullRedisClient } from "../config/redis.js";
import { BaseAgent } from "../modules/agents/base.agent.js";
import { AriaAgent } from "../modules/agents/aria.agent.js";
import { NovaAgent } from "../modules/agents/nova.agent.js";
import { EchoAgent } from "../modules/agents/echo.agent.js";
import { FluxAgent } from "../modules/agents/flux.agent.js";
import { createPendingAction } from "../modules/agents/hitl.service.js";
import { compileFlow } from "../modules/agents/builder/compiler.js";
import { runSandbox } from "../modules/agents/builder/sandbox.js";
import { prisma } from "../config/prisma.js";

const AGENT_INSTANCES: Record<string, BaseAgent> = {
  operations: new AriaAgent(),
  finance: new NovaAgent(),
  customer: new EchoAgent(),
  dev: new FluxAgent(),
};

// ─── Job data shapes ───────────────────────────────────────────────

interface BuiltInAgentJobData {
  orgId: string;
  agentId: string;
  agentName: string;
  agentType: string;
  prompt: string;
  triggerEventId?: string;
}

interface CustomAgentJobData {
  orgId: string;
  customAgentId: string;
  customAgentName: string;
  input: Record<string, unknown>;
  triggerEventId?: string;
}

// ─── Worker ────────────────────────────────────────────────────────

async function processJob(
  job: Job<BuiltInAgentJobData | CustomAgentJobData>,
) {
  const jobName = job.name;

  // ── Built-in agent job ──
  if (jobName === "run-agent") {
    const data = job.data as BuiltInAgentJobData;
    const { orgId, agentId, agentName, agentType, prompt } = data;

    const agent = AGENT_INSTANCES[agentType];
    if (!agent) {
      throw new Error(`No agent implementation for type: ${agentType}`);
    }

    const ctx = { orgId, agentId, agentName, agentType };
    const proposedActions = await agent.run(ctx, prompt);

    if (proposedActions.length === 0) {
      console.log(`[${agentName}] No actions proposed.`);
      return { proposed: 0 };
    }

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
  }

  // ── Custom agent job ──
  if (jobName === "run-custom-agent") {
    const data = job.data as CustomAgentJobData;
    const { orgId, customAgentId, input } = data;

    const customAgent = await prisma.customAgent.findFirst({
      where: {
        id: customAgentId,
        orgId,
        isPublished: true,
        isActive: true,
      },
    });
    if (!customAgent) {
      throw new Error(`Custom agent not found: ${customAgentId}`);
    }

    const flowDef = customAgent.flowDefinition as any;
    const compiled = compileFlow(flowDef.nodes, flowDef.edges);

    if (compiled.errors.filter((e) => e.severity === "error").length > 0) {
      throw new Error(
        `Flow compilation errors: ${compiled.errors.map((e) => e.message).join("; ")}`,
      );
    }

    const tools: Record<string, Function> = {};

    const result = await runSandbox({
      code: compiled.code,
      input,
      orgId,
      tools,
    });

    if (!result.success) {
      throw new Error(`Sandbox error: ${result.error}`);
    }

    const execution = await prisma.customAgentExecution.create({
      data: {
        customAgentId,
        orgId,
        triggeredBy: data.triggerEventId ?? "manual",
        triggerType: "event",
        status: result.success ? "success" : "failed",
        startedAt: new Date(),
        completedAt: new Date(),
        input: input as any,
        output: (result.output ?? {}) as any,
        proposedActions: Array.isArray(
          (result.output as any)?.proposedActions,
        )
          ? (result.output as any).proposedActions.length
          : 0,
        errorMessage: result.error,
      },
    });

    await prisma.customAgent.update({
      where: { id: customAgentId },
      data: {
        executionCount: { increment: 1n },
        ...(result.success
          ? { successCount: { increment: 1n } }
          : { failureCount: { increment: 1n } }),
      },
    });

    const proposedActions =
      (result.output as any)?.proposedActions ?? [];
    for (const action of proposedActions) {
      await createPendingAction({
        agentId: customAgentId,
        orgId,
        actionType: action.type,
        description: action.description,
        payload: { ...action.payload, customAgentId },
        riskLevel: action.riskLevel ?? "medium",
        confidence: action.confidence ?? 0.5,
      });
    }

    return { executionId: execution.id, proposed: proposedActions.length };
  }

  throw new Error(`Unknown job type: ${jobName}`);
}

export const aiWorker = new Worker<BuiltInAgentJobData | CustomAgentJobData>(
  "ai-queue",
  async (job) => processJob(job),
  {
    connection: bullRedisClient,
    concurrency: 3,
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

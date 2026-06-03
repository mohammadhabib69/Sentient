/**
 * Base agent (Phase 8 §4).
 *
 * Every Sentient agent (Aria, Nova, Echo, Flux) extends this class. The
 * base handles:
 *   - Active-agent verification
 *   - RAG memory retrieval + injection into the system prompt
 *   - LangChain `createAgent` wiring (ReAct pattern with tools)
 *   - Parsing proposed actions from the LLM's final output
 *   - Persisting the run to memory and logging an `agent.run.completed`
 *     event via the existing event store
 *
 * Subclasses declare `name`, `type`, `systemPrompt`, and `tools`.
 */
import { ActorType } from "@prisma/client";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import type { StructuredTool } from "@langchain/core/tools";
import { prisma } from "../../config/prisma.js";
import { eventsService } from "../events/events.service.js";
import { CHAT_MODEL } from "../../config/openai.js";
import { env } from "../../config/env.js";
import { retrieveMemory, storeMemory } from "./embedding.service.js";

export interface AgentRunContext {
  orgId: string;
  agentId: string;
  agentName: string;
  agentType: string;
  triggerEvent?: Record<string, unknown>;
  additionalContext?: string;
}

export interface AgentAction {
  type: string; // e.g. "reassign_task"
  description: string; // Human-readable explanation
  payload: Record<string, unknown>; // Action parameters
  riskLevel: "low" | "medium" | "high";
  confidence: number; // 0–1
}

export abstract class BaseAgent {
  protected abstract name: string;
  protected abstract type: string;
  protected abstract systemPrompt: string;
  protected abstract tools: StructuredTool[];

  /**
   * Run the agent with a given context. Returns the list of proposed
   * actions the agent decided to take — the caller (BullMQ worker) is
   * responsible for feeding each into the HITL pipeline.
   */
  async run(ctx: AgentRunContext, userPrompt: string): Promise<AgentAction[]> {
    const agentRecord = await prisma.agent.findFirst({
      where: { id: ctx.agentId, orgId: ctx.orgId, isActive: true },
    });
    if (!agentRecord) {
      throw new Error(`Agent ${ctx.agentId} not found or inactive`);
    }

    // 1. Retrieve relevant memories via pgvector RAG.
    const memories = await retrieveMemory({
      agentId: ctx.agentId,
      namespace: agentRecord.memoryNs ?? ctx.agentId,
      query: userPrompt,
    });

    const memoryContext =
      memories.length > 0
        ? `\nRelevant memory:\n${memories.map((m) => `- ${m.content}`).join("\n")}`
        : "";

    // 2. Build the LLM.
    const llm = new ChatOpenAI({
      model: CHAT_MODEL,
      temperature: 0.1,
      timeout: env.AGENT_TIMEOUT_MS,
    });

    // 3. Create the agent (LangChain v1 ReAct pattern).
    const agent = createAgent({
      tools: this.tools,
      systemPrompt: this.systemPrompt + memoryContext,
      model: llm,
    });

    // 4. Run the agent.
    const result = await agent.invoke(
      { messages: [{ role: "user", content: userPrompt }] },
      { recursionLimit: env.AGENT_MAX_ITERATIONS * 2 },
    );

    // 5. Extract proposed actions from the final AI message.
    const lastMessage = result.messages?.[result.messages.length - 1];
    const text =
      lastMessage && typeof (lastMessage as any).content === "string"
        ? (lastMessage as any).content
        : "";
    const proposedActions = this.parseProposedActions(text);

    // 6. Persist this run in memory.
    await storeMemory({
      agentId: ctx.agentId,
      namespace: agentRecord.memoryNs ?? ctx.agentId,
      content: `Ran analysis on: ${userPrompt}. Proposed: ${proposedActions
        .map((a) => a.description)
        .join("; ") || "(no actions)"}`,
      metadata: {
        orgId: ctx.orgId,
        timestamp: new Date().toISOString(),
        proposedCount: proposedActions.length,
      },
    });

    // 7. Log the agent run as an event (for audit + AgentReadModel updates).
    await eventsService.logEvent({
      orgId: ctx.orgId,
      type: "agent.run.completed",
      aggregateId: ctx.agentId,
      aggregateType: "agent",
      payload: {
        agentName: ctx.agentName,
        agentType: ctx.agentType,
        prompt: userPrompt,
        actionsProposed: proposedActions.length,
      },
      actorId: ctx.agentId,
      actorType: ActorType.AGENT,
    });

    return proposedActions;
  }

  /**
   * Subclasses can override this for custom parsing logic. Default
   * behavior: extract a JSON array from a `json` code block, fall back
   * to a plain-JSON parse of the whole output.
   */
  protected parseProposedActions(output: string): AgentAction[] {
    try {
      const jsonMatch = output.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]!);
        if (Array.isArray(parsed)) return this.normalizeActions(parsed);
      }
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed)) return this.normalizeActions(parsed);
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Coerce the LLM's free-form output into a strictly-typed AgentAction
   * array, dropping anything that doesn't have the required fields.
   */
  private normalizeActions(raw: unknown[]): AgentAction[] {
    const out: AgentAction[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Record<string, unknown>;
      const type = typeof obj.type === "string" ? obj.type : null;
      const description =
        typeof obj.description === "string" ? obj.description : null;
      const payload =
        obj.payload && typeof obj.payload === "object"
          ? (obj.payload as Record<string, unknown>)
          : {};
      const risk = obj.riskLevel;
      const riskLevel: AgentAction["riskLevel"] =
        risk === "high" || risk === "medium" || risk === "low" ? risk : "low";
      const conf = typeof obj.confidence === "number" ? obj.confidence : 0;
      if (!type || !description) continue;
      out.push({
        type,
        description,
        payload,
        riskLevel,
        confidence: Math.max(0, Math.min(1, conf)),
      });
    }
    return out;
  }
}

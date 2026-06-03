/**
 * Multi-agent supervisor (Phase 8 §12).
 *
 * When a task spans multiple domains (e.g. "customer reports a billing
 * bug"), LangGraph (or a small supervisor LLM call) decides which
 * agents should be woken up, then enqueues a job for each. The agents
 * run independently and each proposal still flows through HITL.
 */
import { ChatOpenAI } from "@langchain/openai";
import { prisma } from "../../config/prisma.js";
import { aiQueue } from "../../jobs/queues.js";
import { ADVANCED_MODEL } from "../../config/openai.js";

export interface SupervisorResult {
  agents: string[];
  reasoning: string;
}

/**
 * Route a prompt to one or more agent types. The supervisor uses the
 * advanced model (gpt-4o) for classification — the call is short and
 * temperature is 0 so routing is deterministic.
 */
export async function runSupervisor(params: {
  orgId: string;
  prompt: string;
}): Promise<SupervisorResult> {
  const llm = new ChatOpenAI({ model: ADVANCED_MODEL, temperature: 0 });

  const routingPrompt = `You are a supervisor AI that routes tasks to specialized agents.
Available agents:
- operations (Aria): task management, deadlines, workload, project health
- finance (Nova): invoices, payments, budgets, financial anomalies
- customer (Echo): customer issues, sentiment, escalations, support
- dev (Flux): bugs, technical debt, code issues, deploy concerns

Determine which agent(s) should handle this task and respond with JSON:
{ "agents": ["operations"], "reasoning": "..." }

Task: ${params.prompt}`;

  const response = await llm.invoke([{ role: "user", content: routingPrompt }]);
  const content = response.content as string;
  let routing: SupervisorResult;
  try {
    routing = JSON.parse(content);
  } catch {
    const match = content.match(/```json\n([\s\S]*?)\n```/);
    routing = match
      ? (JSON.parse(match[1]!) as SupervisorResult)
      : { agents: ["operations"], reasoning: "Fallback routing" };
  }

  // Enqueue jobs for each assigned agent.
  const agents = await prisma.agent.findMany({
    where: { orgId: params.orgId, type: { in: routing.agents as any }, isActive: true },
  });

  for (const agent of agents) {
    await aiQueue.add("run-agent", {
      orgId: params.orgId,
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.type,
      prompt: params.prompt,
    });
  }

  return routing;
}

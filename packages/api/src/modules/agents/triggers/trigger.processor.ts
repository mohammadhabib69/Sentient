/**
 * Trigger processor (Phase 8 §6.2).
 *
 * Called by the Outbox poller after each event is delivered. For every
 * registered trigger that matches the event type, we evaluate the
 * `shouldTrigger()` condition, find the org's active agent of the
 * right type, build a prompt, and enqueue an `ai-queue` job.
 *
 * Errors are caught per-trigger so one failing trigger can't block the
 * outbox poller or other triggers.
 */
import { prisma } from "../../../config/prisma.js";
import { aiQueue } from "../../../jobs/queues.js";
import type { OutboxEventEnvelope } from "../../events/events.service.js";
import { AGENT_TRIGGERS } from "./trigger.registry.js";

/** Lower number = higher priority in BullMQ. */
function getRiskPriority(eventType: string): number {
  if (eventType.includes("blocked")) return 1;
  if (eventType.includes("overdue")) return 2;
  if (eventType.includes("agent")) return 2;
  return 5;
}

export async function processTriggers(event: OutboxEventEnvelope): Promise<void> {
  // Skip agent.* events to avoid infinite loops (an agent run shouldn't
  // re-trigger more agents).
  if (event.type.startsWith("agent.")) return;

  const matching = AGENT_TRIGGERS.filter((t) => t.eventTypes.includes(event.type));
  if (matching.length === 0) return;

  for (const trigger of matching) {
    try {
      const shouldRun = await trigger.shouldTrigger(event);
      if (!shouldRun) continue;

      const agent = await prisma.agent.findFirst({
        where: { orgId: event.orgId, type: trigger.agentType as any, isActive: true },
      });
      if (!agent) continue;

      const prompt = await trigger.buildPrompt(event);

      await aiQueue.add(
        "run-agent",
        {
          orgId: event.orgId,
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type,
          prompt,
          triggerEventId: event.id,
        },
        {
          priority: getRiskPriority(event.type),
          attempts: 2,
          backoff: { type: "exponential", delay: 5000 },
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Trigger] Error processing trigger for ${trigger.agentType}:`,
        message,
      );
    }
  }

  // ─── Custom agent triggers ─────────────────────────────────────
  const customAgents = await prisma.customAgent.findMany({
    where: {
      orgId: event.orgId,
      isPublished: true,
      isActive: true,
    },
  });

  for (const customAgent of customAgents) {
    try {
      const flow = customAgent.flowDefinition as any;

      // Check if trigger node matches this event
      const triggerNode = flow.nodes?.find((n: any) =>
        n.type?.startsWith("trigger"),
      );
      if (!triggerNode) continue;

      const triggerConfig = triggerNode.data?.config ?? triggerNode.data ?? {};
      const [cat, subtype] = (triggerNode.type ?? "").split(":");

      // Check event type match
      if (cat === "trigger" && subtype === "event") {
        const eventTypes = triggerConfig.eventType
          ? Array.isArray(triggerConfig.eventType)
            ? triggerConfig.eventType
            : [triggerConfig.eventType]
          : [];

        if (!eventTypes.includes(event.type)) continue;

        // Check filter expression
        if (triggerConfig.filterExpression) {
          try {
            const context = {
              event: { type: event.type, payload: event.payload },
              org: { id: event.orgId },
            };
            // eslint-disable-next-line no-eval
            const shouldRun = eval(triggerConfig.filterExpression);
            if (!shouldRun) continue;
          } catch {
            continue;
          }
        }

        // Enqueue job
        await aiQueue.add(
          "run-custom-agent",
          {
            orgId: event.orgId,
            customAgentId: customAgent.id,
            customAgentName: customAgent.name,
            input: event,
            triggerEventId: event.id,
          },
          {
            priority: getRiskPriority(event.type),
            attempts: 2,
            backoff: { type: "exponential", delay: 5000 },
          },
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Trigger] Error processing custom agent ${customAgent.id}:`,
        message,
      );
    }
  }
}

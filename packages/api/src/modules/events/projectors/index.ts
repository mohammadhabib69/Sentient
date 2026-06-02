import type { OutboxEventEnvelope } from "../events.service.js";
import { projectProjector } from "./project.projector.js";
import { agentProjector } from "./agent.projector.js";
import { orgMetricsProjector } from "./orgMetrics.projector.js";
import { userActivityProjector } from "./userActivity.projector.js";
import { notificationProjector } from "./notification.projector.js";

/**
 * Projector registry. Each projector is a pure function:
 *   `(event) => read model update(s)`.
 *
 * Run sequentially per call site — `runProjectors()` invokes all of
 * them in parallel with `Promise.allSettled` so a single failed
 * projector does not block the others. Each projector is also
 * responsible for filtering on the event types it cares about.
 */
const projectors = [
  projectProjector,
  agentProjector,
  orgMetricsProjector,
  userActivityProjector,
  notificationProjector,
];

export async function runProjectors(event: OutboxEventEnvelope): Promise<void> {
  await Promise.allSettled(projectors.map((fn) => fn(event)));
}

export { projectProjector } from "./project.projector.js";
export { agentProjector } from "./agent.projector.js";
export { orgMetricsProjector } from "./orgMetrics.projector.js";
export { userActivityProjector } from "./userActivity.projector.js";
export { notificationProjector } from "./notification.projector.js";

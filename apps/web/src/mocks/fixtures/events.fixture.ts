import { StreamEvent } from "@/types/event.types";

/** PRD showcase events (Reality Stream page) */
const PRD_EVENTS: StreamEvent[] = [
  {
    id: "evt_flux_suggestion",
    type: "agent_suggestion",
    aggregateId: "route_map_v2",
    aggregateType: "project",
    payload: {
      event_id: "evt_8832a1",
      type: "suggestion",
      target: "route_map_v2",
      metrics: { latency_reduction: "14%", confidence: 0.92 },
      nodes_affected: ["n_441", "n_442", "n_489"],
    },
    actor: { id: "agt_flux", name: "Flux", type: "agent" },
    occurredAt: new Date().toISOString(),
    display: {
      variant: "suggestion",
      badge: "SUGGESTION",
      description:
        "Analyzed routing algorithm variance. Suggested optimizing pathing node distribution to reduce latency by 14%.",
      resourceLabel: "route_map_v2.json",
      actionLabel: "View Details",
      initials: "FL",
    },
  },
  {
    id: "evt_nova_anomaly",
    type: "anomaly_detected",
    aggregateId: "cluster-beta-9",
    aggregateType: "system",
    payload: { cluster: "beta-9", frequency_spike: true },
    actor: { id: "agt_nova", name: "Nova", type: "agent" },
    occurredAt: new Date(Date.now() - 120000).toISOString(),
    display: {
      variant: "anomaly",
      badge: "ANOMALY",
      description:
        "Detected uncharacteristic spike in resource request frequency from cluster beta-9. Sandboxing automated.",
      resourceLabel: "cluster-beta-9",
      actionLabel: "Investigate",
      initials: "NV",
    },
  },
  {
    id: "evt_operator_approval",
    type: "deployment_approved",
    aggregateId: "deploy_req_882",
    aggregateType: "project",
    payload: { deploymentId: "deploy_req_882", environment: "production" },
    actor: { id: "usr_operator", name: "Operator K.", type: "user" },
    occurredAt: new Date(Date.now() - 420000).toISOString(),
    display: {
      variant: "approval",
      badge: "APPROVAL",
      description:
        "Manually approved deployment of suggested routing optimizations to production environment.",
      resourceLabel: "deploy_req_882",
      actionLabel: "View Details",
    },
  },
  {
    id: "evt_kernel_critical",
    type: "webhook_failed",
    aggregateId: "shard_auth_01",
    aggregateType: "system",
    payload: { endpoint: "shard_auth_01", statusCode: 502, error: "Connection reset by peer" },
    actor: { id: "sys_kernel", name: "System Kernel", type: "system" },
    occurredAt: new Date(Date.now() - 1620000).toISOString(),
    display: {
      variant: "critical",
      badge: "CRITICAL",
      description: "Authentication heartbeat failure on remote shard. Connection reset by peer.",
      resourceLabel: "shard_auth_01",
      actionLabel: "View Logs",
    },
  },
];

export const MOCK_EVENTS: StreamEvent[] = [
  ...PRD_EVENTS,
  ...Array.from({ length: 26 }).map((_, i) => {
    const isAgent = i % 3 === 0;
    const isSystem = i % 7 === 0;
    const isError = i === 5;

    let type = "task_completed";
    let payload: Record<string, unknown> = { taskId: `task_${i}`, duration: 120 };
    let actor: StreamEvent["actor"] = {
      id: "usr_1",
      name: "Mohammad Habib",
      type: "user",
      avatarUrl: "/avatars/user.png",
    };

    if (isAgent) {
      type = "agent_action_executed";
      payload = { actionId: `act_${i}`, result: "success" };
      actor = { id: "agt_4", name: "Flux", type: "agent" };
    } else if (isSystem) {
      type = "deployment_finished";
      payload = { version: "v1.4.2" };
      actor = { id: "sys_1", name: "System", type: "system" };
    }

    if (isError) {
      type = "webhook_failed";
      payload = { endpoint: "https://api.acme.corp/webhook", statusCode: 502 };
      actor = { id: "sys_1", name: "System", type: "system" };
    }

    return {
      id: `evt_${i}`,
      type,
      aggregateId: `agg_${i % 5}`,
      aggregateType: isAgent ? "agent" : "project",
      payload,
      actor,
      occurredAt: new Date(Date.now() - 1000 * 60 * 15 * (i + 5)).toISOString(),
    };
  }),
];

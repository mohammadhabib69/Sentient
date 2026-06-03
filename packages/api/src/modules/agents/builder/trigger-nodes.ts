/**
 * Trigger node definitions (Phase 9 §4.2).
 *
 * Each trigger type defines its label, description, config fields,
 * and output schema — used by the canvas config panel and the compiler.
 */
import { BaseNodeDef } from "./node-types.js";

export const TRIGGER_NODE_DEFS: Record<string, BaseNodeDef> = {
  event: {
    label: "Event Trigger",
    description: "Wake agent when an event occurs",
    category: "trigger",
    icon: "⚡",
    configFields: [
      {
        name: "eventType",
        label: "Event Type",
        type: "select",
        options: [
          "task.created",
          "task.status_changed",
          "task.blocked",
          "agent.action.created",
        ],
        required: true,
      },
      {
        name: "filterExpression",
        label: "Filter (JS expression — optional)",
        type: "code",
        language: "javascript",
        example: "event.payload.priority === 'critical'",
        help: "Only trigger if this expression is true. Variables: event, org",
      },
      {
        name: "debounceSeconds",
        label: "Debounce (seconds)",
        type: "number",
        default: 0,
        help: "Wait N seconds before triggering to batch multiple events",
      },
    ],
    outputs: [{ name: "data", type: "object", description: "The event data" }],
  },

  schedule: {
    label: "Schedule Trigger",
    description: "Wake agent on a schedule (cron)",
    category: "trigger",
    icon: "🕐",
    configFields: [
      {
        name: "cronExpression",
        label: "Cron Expression",
        type: "text",
        placeholder: "0 9 * * 1",
        help: "0 9 * * 1 = Every Monday at 9 AM",
        required: true,
      },
    ],
    outputs: [{ name: "data", type: "object", description: "Empty object {}" }],
  },

  webhook: {
    label: "Webhook Trigger",
    description: "Wake agent via HTTP webhook",
    category: "trigger",
    icon: "🪝",
    configFields: [
      {
        name: "webhookSecret",
        label: "Webhook Secret (optional)",
        type: "password",
        help: "HMAC secret for signature verification",
      },
    ],
    outputs: [
      { name: "body", type: "object", description: "Request body" },
      { name: "query", type: "object", description: "Query params" },
    ],
  },

  manual: {
    label: "Manual Trigger",
    description: "Agent runs only when manually triggered by a user",
    category: "trigger",
    icon: "👆",
    configFields: [
      {
        name: "inputSchema",
        label: "Input Schema (JSON Schema)",
        type: "code",
        language: "json",
        example:
          '{ "type": "object", "properties": { "taskId": { "type": "string" } } }',
        help: "Define what inputs the user must provide when triggering",
      },
    ],
    outputs: [
      { name: "input", type: "object", description: "User-provided input" },
    ],
  },
} as const;

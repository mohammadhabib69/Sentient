import { z } from "zod";

/**
 * Per-event-type payload validators.
 *
 * Unknown types pass through (forward-compatibility — newer event types
 * can be produced by future services without breaking older consumers).
 * If a known type fails its schema, the event is rejected at the
 * `logEvent()` boundary.
 *
 * These mirror the payloads emitted by Phase 5 services. They are
 * intentionally permissive on optional fields so existing callers that
 * include extra metadata do not break.
 */

const taskCreatedSchema = z.object({
  title: z.string(),
  projectId: z.string(),
  status: z.string(),
  position: z.number().int().optional(),
  priority: z.string().optional(),
});

const taskStatusChangedSchema = z.object({
  changes: z
    .object({
      status: z.object({ from: z.string(), to: z.string() }).optional(),
    })
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const taskAssignedSchema = z.object({
  changes: z
    .object({
      assigneeId: z.object({ from: z.string().nullable(), to: z.string().nullable() }).optional(),
    })
    .optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
});

const taskMovedSchema = z.object({
  from: z.object({ status: z.string(), position: z.number().int() }),
  to: z.object({ status: z.string(), position: z.number().int() }),
});

const taskCommentAddedSchema = z.object({
  commentId: z.string(),
  contentPreview: z.string(),
});

const projectCreatedSchema = z.object({
  orgId: z.string().optional(),
  name: z.string(),
  workspaceId: z.string().optional(),
});

const projectUpdatedSchema = z.object({
  changes: z.record(z.string(), z.object({ from: z.unknown(), to: z.unknown() })).optional(),
});

const projectDeletedSchema = z.object({
  name: z.string().optional(),
});

const taskUpdatedSchema = z.object({
  changes: z.record(z.string(), z.object({ from: z.unknown(), to: z.unknown() })).optional(),
});

const taskDeletedSchema = z.object({
  title: z.string().optional(),
});

const tasksBulkMovedSchema = z.object({
  count: z.number().int(),
});

const agentActionApprovedSchema = z.object({
  actionId: z.string(),
  actionType: z.string().optional(),
  approvedBy: z.string().optional(),
});

const agentActionExecutedSchema = z.object({
  actionId: z.string(),
  result: z.unknown().optional(),
});

const agentActionCreatedSchema = z.object({
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  agentType: z.string().optional(),
  description: z.string().optional(),
});

export const eventPayloadSchemas: Record<string, z.ZodType> = {
  "task.created": taskCreatedSchema,
  "task.updated": taskUpdatedSchema,
  "task.deleted": taskDeletedSchema,
  "task.status_changed": taskStatusChangedSchema,
  "task.assigned": taskAssignedSchema,
  "task.moved": taskMovedSchema,
  "tasks.bulk_moved": tasksBulkMovedSchema,
  "task.comment_added": taskCommentAddedSchema,
  "project.created": projectCreatedSchema,
  "project.updated": projectUpdatedSchema,
  "project.deleted": projectDeletedSchema,
  "agent.action.created": agentActionCreatedSchema,
  "agent.action.approved": agentActionApprovedSchema,
  "agent.action.executed": agentActionExecutedSchema,
};

/**
 * Validate an event payload against the registered schema for its type.
 * Returns true for unknown event types (forward-compat) or when the
 * payload matches. Returns false when validation fails.
 */
export function validateEventPayload(type: string, payload: unknown): boolean {
  const schema = eventPayloadSchemas[type];
  if (!schema) return true;
  return schema.safeParse(payload).success;
}

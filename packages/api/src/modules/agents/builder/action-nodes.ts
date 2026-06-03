/**
 * Action node definitions (Phase 9 §4.3).
 *
 * Each action type defines its label, description, config fields,
 * and output schema — used by the canvas config panel and the compiler.
 */
import { BaseNodeDef } from "./node-types.js";

export const ACTION_NODE_DEFS: Record<string, BaseNodeDef> = {
  reassign_task: {
    label: "Reassign Task",
    description: "Assign a task to a team member",
    category: "action",
    icon: "➡️",
    configFields: [
      {
        name: "taskId",
        label: "Task ID (from input or reference)",
        type: "input-reference",
        help: "Click {{}} to select from previous node outputs",
        required: true,
      },
      {
        name: "newAssigneeId",
        label: "New Assignee",
        type: "user-select",
        help: "Pick a user or {{reference}} to previous node output",
        required: true,
      },
      {
        name: "reason",
        label: "Reason (optional)",
        type: "textarea",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "object",
        description: "Result: { taskId, newAssigneeId }",
      },
    ],
  },

  update_task_priority: {
    label: "Update Task Priority",
    description: "Change a task priority",
    category: "action",
    icon: "⬆️",
    configFields: [
      {
        name: "taskId",
        label: "Task ID",
        type: "input-reference",
        required: true,
      },
      {
        name: "priority",
        label: "New Priority",
        type: "select",
        options: ["low", "medium", "high", "critical"],
        required: true,
      },
    ],
    outputs: [
      { name: "result", type: "object", description: "Result object" },
    ],
  },

  send_notification: {
    label: "Send Notification",
    description: "Send a notification to a user",
    category: "action",
    icon: "🔔",
    configFields: [
      {
        name: "userId",
        label: "Recipient User",
        type: "input-reference",
        required: true,
      },
      {
        name: "title",
        label: "Title",
        type: "text",
        required: true,
      },
      {
        name: "body",
        label: "Message Body",
        type: "textarea",
        required: true,
      },
      {
        name: "notificationType",
        label: "Type",
        type: "select",
        options: ["alert", "info", "warning", "success"],
        default: "info",
      },
    ],
    outputs: [
      { name: "result", type: "object", description: "Notification ID" },
    ],
  },

  create_task: {
    label: "Create Task",
    description: "Create a new task in a project",
    category: "action",
    icon: "✏️",
    configFields: [
      {
        name: "projectId",
        label: "Project ID",
        type: "input-reference",
        required: true,
      },
      {
        name: "title",
        label: "Task Title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        label: "Description (optional)",
        type: "textarea",
      },
      {
        name: "assigneeId",
        label: "Assignee (optional)",
        type: "input-reference",
      },
      {
        name: "priority",
        label: "Priority",
        type: "select",
        options: ["low", "medium", "high", "critical"],
        default: "medium",
      },
      {
        name: "dueDate",
        label: "Due Date (optional)",
        type: "date-picker",
      },
    ],
    outputs: [
      { name: "taskId", type: "string", description: "Created task ID" },
    ],
  },

  post_comment: {
    label: "Post Comment",
    description: "Add a comment to a task",
    category: "action",
    icon: "💬",
    configFields: [
      {
        name: "taskId",
        label: "Task ID",
        type: "input-reference",
        required: true,
      },
      {
        name: "content",
        label: "Comment Content",
        type: "textarea",
        required: true,
      },
    ],
    outputs: [
      { name: "commentId", type: "string", description: "Created comment ID" },
    ],
  },
} as const;

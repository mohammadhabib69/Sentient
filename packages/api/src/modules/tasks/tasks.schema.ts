import { z } from "zod";

/**
 * Tasks module — Zod input schemas (PRD §5).
 *
 * Status / priority use uppercase strings (matches Prisma's TS-exposed
 * enum variants). `dueDate` is `YYYY-MM-DD` or full ISO datetime.
 */
export const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BLOCKED",
]);

/**
 * POST /v1/tasks — create a new task.
 */
export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  parentTaskId: z.string().uuid().optional(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters")
    .trim(),
  description: z.string().max(10000).optional(),
  status: taskStatusSchema.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .transform((v) => (v ? new Date(v) : undefined))
    .optional(),
  estimatedHours: z.coerce.number().min(0).max(10000).optional(),
});

/**
 * PATCH /v1/tasks/:id — partial update.
 */
export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(10000).optional(),
    status: taskStatusSchema.optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .optional()
      .transform((v) => (v ? new Date(v) : undefined))
      .optional(),
    estimatedHours: z.coerce.number().min(0).max(10000).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.assigneeId !== undefined ||
      data.dueDate !== undefined ||
      data.estimatedHours !== undefined,
    { message: "At least one field must be provided" },
  );

/**
 * POST /v1/tasks/:id/move — change a task's status and position.
 */
export const moveTaskSchema = z.object({
  status: taskStatusSchema,
  position: z.number().int().min(0),
});

/**
 * POST /v1/tasks/bulk-move — apply a batch of moves atomically.
 */
export const bulkPositionSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: taskStatusSchema,
        position: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(200),
});

/**
 * POST /v1/tasks/:id/comments — add a comment.
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment must not exceed 5000 characters"),
});

/**
 * GET /v1/tasks — list with filters.
 *
 * `projectId` is required (per PRD §5.3 — we always scope a task to a
 * project). Subtask listing is opt-in.
 */
export const listTasksQuerySchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  status: taskStatusSchema.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().min(1).max(100).optional(),
  includeSubtasks: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

/**
 * Common path params.
 */
export const taskIdParamSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
});
export const taskCommentIdParamSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
  commentId: z.string().uuid("Invalid comment ID"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type BulkPositionInput = z.infer<typeof bulkPositionSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

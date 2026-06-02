import { graphSyncQueue } from "../../jobs/queues.js";

/**
 * Discriminated union of every per-CRUD graph sync job the API can enqueue.
 *
 * The `action` string is also used as the BullMQ `name` of the job, so
 * the worker can branch on it directly with a `switch` statement.
 *
 * Add new actions here as new CRUD modules land (projects, tasks, …).
 */
export type GraphSyncJob =
  | { action: "CREATE_WORKSPACE"; workspaceId: string }
  | { action: "UPDATE_WORKSPACE"; workspaceId: string }
  | { action: "DELETE_WORKSPACE"; workspaceId: string }
  | { action: "CREATE_PROJECT"; projectId: string }
  | { action: "UPDATE_PROJECT"; projectId: string }
  | { action: "DELETE_PROJECT"; projectId: string }
  | { action: "CREATE_TASK"; taskId: string }
  | { action: "UPDATE_TASK"; taskId: string }
  | { action: "DELETE_TASK"; taskId: string }
  | { action: "ASSIGN_TASK"; taskId: string; userId: string }
  | { action: "ADD_MEMBER"; workspaceId: string; userId: string }
  | { action: "REBUILD_ORG_GRAPH"; orgId: string };

/**
 * Enqueue a graph sync job. The job `name` is the `action` string so the
 * worker can match on it; the full payload (including the action) is
 * passed as the job `data`.
 *
 * Errors from the queue are intentionally swallowed by the caller (we use
 * `Promise.allSettled` in services) — losing a graph sync is recoverable
 * by re-running the `REBUILD_ORG_GRAPH` reconciliation job.
 */
export async function enqueueGraphSync(job: GraphSyncJob): Promise<void> {
  await graphSyncQueue.add(job.action, job);
}

# @sentient/graph

Neo4j graph schema and sync helpers for the Sentient Phase 0 business knowledge graph.

## Apply Schema

Start Neo4j with Docker Compose, then apply constraints and indexes:

```bash
docker compose up -d neo4j
cypher-shell -a bolt://localhost:7687 -u neo4j -p sentient-neo4j-password \
  -f packages/graph/cypher/001_schema.cypher
```

The schema script creates unique `id` constraints for:

- `Organization`
- `User`
- `Workspace`
- `Project`
- `Task`
- `Agent`

It also creates indexes for tenant, status, priority, role, and agent type lookups.

## Load Demo Graph

The demo graph script mirrors the deterministic PostgreSQL seed data:

```bash
cypher-shell -a bolt://localhost:7687 -u neo4j -p sentient-neo4j-password \
  -f packages/graph/cypher/002_seed_demo_graph.cypher
```

The script is idempotent. It uses `MERGE` for nodes and relationships, so it can be run repeatedly.

Expected demo graph shape:

- 1 organization
- 5 users
- 2 workspaces
- 4 projects
- 15 tasks
- 4 agents

## Sync Service

Application code should create one driver and reuse it:

```ts
import { GraphSyncService, createGraphDriver } from "@sentient/graph";

const driver = createGraphDriver({
  uri: process.env.NEO4J_URI ?? "bolt://localhost:7687",
  user: process.env.NEO4J_USER ?? "neo4j",
  password: process.env.NEO4J_PASSWORD ?? "sentient-neo4j-password",
});

const graphSync = new GraphSyncService(driver);

await graphSync.syncOrganizationGraph(snapshot);
```

The snapshot should come from PostgreSQL records after a successful write transaction. The graph service accepts plain objects rather than Prisma-specific types.

## Sync Rules

PostgreSQL remains the system of record. Neo4j is a query-optimized projection for entity relationships, bottleneck detection, dependency traversal, and agent context.

Run graph sync:

- After onboarding creates an organization, users, workspaces, projects, tasks, and agents.
- After task assignment, status, priority, project, or parent task changes.
- After agent actions are approved or executed and reference a task.
- After periodic repair jobs that rebuild graph state from PostgreSQL snapshots.

Do not sync before the PostgreSQL transaction commits. If an API endpoint writes PostgreSQL and then updates Neo4j, treat Neo4j failures as projection failures: log, emit a retryable event, and keep PostgreSQL committed.

## Future Event-Driven Flow

After the event/queue layer is implemented, graph sync should move behind the event stream:

1. PostgreSQL transaction writes domain rows and appends an immutable event.
2. Queue worker consumes the event.
3. Worker loads the affected PostgreSQL rows.
4. Worker calls the targeted `GraphSyncService` method.
5. Worker emits `graph.updated` over realtime channels.

Step 6 does not hard-delete graph nodes. Future delete/archive workflows should mark nodes inactive or archived unless product requirements explicitly require physical graph deletion.

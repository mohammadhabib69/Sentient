# Sentient Architecture

Sentient is an AI-Native Business Reality Engine. It models a business as a living operational graph, stores all important changes as events, and uses AI agents to observe state, recommend actions, and request human approval when needed.

Phase 0 establishes the modular monolith foundation. It keeps deployment simple while preserving package boundaries that can later become services.

## System Layers

```mermaid
flowchart TB
  subgraph Client["Client Layer"]
    Web["Next.js Web App"]
    Mobile["Expo Mobile App"]
    Docs["Next.js Docs"]
  end

  subgraph Gateway["Gateway Layer"]
    API["Express API"]
    Realtime["Socket.io Gateway"]
    Webhooks["Webhook Ingress/Egress"]
  end

  subgraph Application["Application Layer"]
    Agents["Agent Orchestration"]
    Events["Event Store and CQRS"]
    Queue["BullMQ Workers"]
    Billing["Stripe Billing"]
    Shared["Shared Types and Utilities"]
  end

  subgraph Data["Data Layer"]
    Postgres["PostgreSQL + Prisma"]
    Timescale["TimescaleDB Events Hypertable"]
    Pgvector["pgvector Agent Memory"]
    Neo4j["Neo4j Business Graph"]
    Redis["Redis Queues and Cache"]
    MinIO["S3-Compatible File Storage"]
  end

  Web --> API
  Mobile --> API
  API --> Events
  API --> Agents
  API --> Realtime
  API --> Billing
  API --> Webhooks
  Agents --> Queue
  Queue --> Postgres
  Queue --> Neo4j
  Events --> Postgres
  Events --> Timescale
  Agents --> Pgvector
  Agents --> Neo4j
  API --> Redis
  API --> MinIO
```

## Monorepo Boundaries

```text
apps/
  web       Product UI
  mobile    Mobile approval and operational app
  docs      Developer and product documentation

packages/
  api       HTTP API boundary
  agents    AI agent definitions and orchestration contracts
  database  Prisma schema, migrations, seed, generated client
  events    Event sourcing and CQRS primitives
  graph     Neo4j schema and graph sync service
  queue     BullMQ queue contracts
  realtime  Socket.io realtime gateway contracts
  webhooks  Outbound webhook engine contracts
  billing   Stripe billing boundary
  shared    Shared types, constants, and utilities
```

## Architectural Style

Sentient starts as a modular monolith:

- One repository and one coordinated build graph.
- Clear package boundaries around data, graph, queue, realtime, billing, events, agents, and API.
- PostgreSQL remains the system of record.
- Neo4j, Redis, pgvector, and TimescaleDB are specialized projections or stores for specific query patterns.
- Agent actions use human approval workflows before execution unless explicitly configured otherwise.

This keeps Phase 0 practical while avoiding a tangled single package.

## Data Ownership

PostgreSQL owns durable business records:

- Organizations
- Users and sessions
- Workspaces
- Projects
- Tasks
- Agents and agent actions
- Event store
- Notifications
- Files
- Subscriptions
- Webhooks

TimescaleDB optimizes event time-series queries through the `events` hypertable.

pgvector stores agent memory embeddings in `agent_memory.embedding`.

Neo4j stores the query-optimized business graph:

- `Organization`
- `User`
- `Workspace`
- `Project`
- `Task`
- `Agent`

Redis supports cache, queue coordination, pub/sub, and BullMQ.

MinIO provides local S3-compatible object storage.

## Event And Agent Flow

```mermaid
sequenceDiagram
  participant User
  participant API
  participant DB as PostgreSQL
  participant Events as Event Store
  participant Queue as BullMQ
  participant Agent
  participant Graph as Neo4j
  participant RT as Realtime

  User->>API: Create or update business state
  API->>DB: Commit domain row changes
  API->>Events: Append immutable event
  API->>Queue: Enqueue async projection or agent work
  Queue->>Graph: Sync relationship projection
  Queue->>Agent: Run relevant agent workflow
  Agent->>DB: Create agent action proposal
  Agent->>RT: Notify approver
  User->>API: Approve or reject action
  API->>DB: Persist approval decision
  API->>Events: Append approval event
```

## Phase 0 Infrastructure

Local development runs through Docker Compose:

- `postgres`: TimescaleDB-enabled PostgreSQL
- `redis`: Redis with append-only persistence
- `neo4j`: Neo4j 5 graph database
- `minio`: S3-compatible local object storage

CI/CD runs through GitHub Actions:

- `ci.yml`: lint, typecheck, tests
- `build.yml`: full monorepo build
- `deploy.yml`: deployment structure placeholder for staging and production

## Design Principles

- Keep PostgreSQL as the source of truth.
- Keep derived stores idempotently rebuildable.
- Use immutable events for auditability and future replay.
- Keep package boundaries explicit even before service extraction.
- Use human-in-the-loop approval for high-risk agent actions.
- Prefer typed contracts between packages over shared mutable state.

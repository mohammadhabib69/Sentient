# Sentient

Sentient is an AI-Native Business Reality Engine. It builds a living digital twin of a business and coordinates autonomous AI agents that observe state, detect patterns, and propose actions with human oversight.

This repository contains the Phase 0 monorepo scaffold for the modular monolith described in `phase0.md`.

## Architecture

- **Client layer:** Next.js web app, Expo React Native mobile app, and developer docs site.
- **Gateway layer:** REST, GraphQL, WebSocket, and future Nginx edge routing.
- **Application layer:** auth, workspace, agent orchestration, event store, graph, notifications, billing, webhooks, and analytics modules.
- **Data layer:** PostgreSQL, TimescaleDB, Neo4j, Redis, pgvector, and S3-compatible storage.
- **Infrastructure layer:** Docker, Kubernetes, Helm, Terraform, GitHub Actions, ArgoCD, Prometheus, Grafana, and OpenTelemetry.

## Prerequisites

- Node.js 24 or newer
- pnpm 11.3.0 or newer
- Docker Desktop, for the upcoming database and infrastructure step

## Quick Start

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

For development-specific Docker logging and port overrides:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Local infrastructure endpoints:

- PostgreSQL / TimescaleDB: `localhost:5432`
- Redis: `localhost:6379`
- Neo4j Browser: `http://localhost:7474`
- Neo4j Bolt: `bolt://localhost:7687`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Run local development servers:

```bash
pnpm dev
```

Useful app-specific commands:

```bash
pnpm --filter @sentient/web dev
pnpm --filter @sentient/docs dev
pnpm --filter @sentient/mobile dev
pnpm --filter @sentient/api dev
```

## Monorepo Layout

```text
sentient/
├── apps/
│   ├── web/           Next.js product app
│   ├── mobile/        Expo React Native approval app
│   └── docs/          Developer documentation site
├── packages/
│   ├── api/           Express API boundary
│   ├── agents/        LangChain agent definitions
│   ├── database/      Prisma and database lifecycle
│   ├── events/        Event store and CQRS primitives
│   ├── graph/         Neo4j graph service
│   ├── queue/         BullMQ queues
│   ├── realtime/      Socket.io realtime gateway
│   ├── webhooks/      Outbound webhook engine
│   ├── billing/       Stripe billing integration
│   └── shared/        Shared types, constants, and utilities
├── infra/
│   ├── docker/
│   ├── k8s/
│   ├── helm/
│   └── terraform/
└── .github/workflows/
```

## Phase 0 Workflow

- [x] Initialize the monorepo and package boundaries.
- [x] Add Docker Compose for PostgreSQL/TimescaleDB, Redis, Neo4j, and MinIO.
- [x] Write the Prisma schema for the Section 5 data model.
- [x] Enable pgvector and create the TimescaleDB hypertable for events.
- [x] Add first migrations and seed data.
- [x] Define Neo4j constraints.
- [x] Document `.env.example`.
- [x] Add CI/CD workflows and GitHub branch protection.

## Phase 7 — Event Sourcing + CQRS

The event store from Phase 5 is upgraded to a production-grade event sourcing
system. Every state change is the source of truth; CQRS read models serve
fast queries; the Outbox pattern guarantees zero event loss; the Reality
Stream is powered entirely by events.

### Highlights

- **Event store hardening** — strict Zod payload validation, idempotency
  keys (24h dedupe), per-aggregate versioning, and optional
  `causationId` / `correlationId` for event chains.
- **Outbox pattern** — `logEvent()` writes the event and the outbox row
  in one transaction. A polling worker (every 1s) drains the outbox
  into Socket.io, the Redis Stream, and the projectors, with
  exponential backoff retries (5s → 15s → 45s → 135s → 405s) and a
  dead-letter table after 5 attempts.
- **CQRS read models** — 4 projector-driven tables:
  `project_read_models`, `agent_read_models`, `org_metrics_read_models`,
  `user_activity_read_models`. The dashboard reads from
  `OrgMetricsReadModel` rather than running live scans.
- **Event replay engine** — `POST /v1/events/replay` (super_admin)
  rebuilds any read model by replaying the event history. One replay
  per org at a time (Redis lock). Supports dry-run.
- **Aggregate reconstruction** — `GET /v1/events/aggregate/:type/:id`
  replays the event timeline for one entity and derives its current
  state.
- **Advanced event query API** — `GET /v1/events` now supports
  `typePrefix`, `actorId`, `minVersion`, `sortOrder`, and full
  cursor pagination.
- **Dead letter queue endpoints** — `GET /v1/events/dead-letters`,
  `POST /v1/events/dead-letters/:id/retry`,
  `GET /v1/events/outbox/stats`.
- **Analytics endpoints** — `GET /v1/analytics/overview` reads from
  `OrgMetricsReadModel`; `task-velocity` and `agent-performance` query
  TimescaleDB continuous aggregates (`task_velocity_daily`,
  `agent_performance_daily`, `active_users_hourly`).
- **Optimistic concurrency** — `updateTask()` accepts
  `expectedVersion`; mismatch raises 409.
- **Event-driven notifications** — the `notificationProjector` turns
  `task.assigned` / `task.comment_added` / `agent.action.created` into
  notifications. No more direct `notificationsService.create()` calls
  from controllers.
- **Reality Stream** — `stream:event` is now emitted by the outbox
  poller (after the event is durable in the DB), with new `version` and
  `causationId` fields in the envelope.

### New endpoints

```
GET    /v1/events                            # advanced query
GET    /v1/events/aggregate/:type/:id        # reconstruct timeline
GET    /v1/events/dead-letters               # org_admin+
POST   /v1/events/dead-letters/:id/retry     # org_admin+
GET    /v1/events/outbox/stats               # super_admin
POST   /v1/events/replay                     # super_admin
GET    /v1/analytics/overview                # OrgMetricsReadModel
GET    /v1/analytics/task-velocity?days=N
GET    /v1/analytics/agent-performance?days=N&agentId=...
```

### New env vars

```
EVENT_STORE_RETENTION_DAYS=365
EVENT_REPLAY_BATCH_SIZE=100
OUTBOX_POLL_INTERVAL_MS=1000
OUTBOX_MAX_RETRIES=5
OUTBOX_BATCH_SIZE=50
READ_MODEL_REBUILD_LOCK_TTL=300
```

Apply the TimescaleDB continuous aggregates once per environment:

```bash
docker exec -i sentient-postgres psql -U sentient -d sentient \
  < packages/database/prisma/migrations/timescale_continuous_aggregates.sql
```

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Development Guidelines](docs/DEVELOPMENT.md)
- [Branch Protection](docs/branch-protection.md)
- [Contributing](CONTRIBUTING.md)

## Git Remote

The intended GitHub remote is:

```text
https://github.com/mohammadhabib69/Sentient.git
```

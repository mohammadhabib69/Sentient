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

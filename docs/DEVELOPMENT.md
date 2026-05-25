# Development Guidelines

This document defines the working standards for Sentient Phase 0.

## Baseline

- Runtime: Node.js 24 or newer
- Package manager: pnpm 11.3.0
- Build orchestration: Turborepo
- Language: TypeScript
- Formatting: Prettier
- Linting: ESLint
- Tests: Vitest

## Package Boundaries

Use the existing package boundaries:

- `@sentient/api`: HTTP API boundary.
- `@sentient/agents`: AI agent contracts and orchestration.
- `@sentient/database`: Prisma schema, migrations, seed, and database lifecycle.
- `@sentient/events`: event sourcing and CQRS primitives.
- `@sentient/graph`: Neo4j schema and sync service.
- `@sentient/queue`: BullMQ queue contracts.
- `@sentient/realtime`: Socket.io contracts.
- `@sentient/webhooks`: webhook delivery contracts.
- `@sentient/billing`: Stripe billing boundary.
- `@sentient/shared`: shared types, constants, and utilities.

Prefer importing from package public exports instead of deep internal paths.

## Coding Standards

- Use TypeScript for all application and package code.
- Keep package APIs small and explicit.
- Prefer named exports for shared library code.
- Keep database access inside `@sentient/database` or service code that clearly owns the transaction.
- Keep Neo4j access behind `@sentient/graph`.
- Use parameterized queries for raw SQL and Cypher.
- Avoid real secrets in tests, fixtures, docs, and screenshots.
- Keep comments focused on non-obvious behavior and important invariants.

## Data Rules

- PostgreSQL is the source of truth.
- Neo4j is an idempotent projection and must be rebuildable.
- Redis state must be treated as disposable unless explicitly persisted by a queue.
- Event records are append-only.
- Agent actions should preserve approval and execution audit data.
- Do not add foreign keys for polymorphic references unless the entity relationship becomes fixed.

## Local Checks

Run before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Database changes should also run:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

When changing docs or workflow YAML:

```bash
pnpm exec prettier --check docs .github/workflows
```

## Database Change Process

1. Update `packages/database/prisma/schema.prisma`.
2. Generate or edit migration SQL under `packages/database/prisma/migrations/`.
3. Preserve extension setup for TimescaleDB and pgvector when required.
4. Run `pnpm db:generate`.
5. Run `pnpm db:migrate`.
6. Update `packages/database/src/seed.ts` when the demo dataset needs new required fields.
7. Update `docs/DATABASE.md`.

## Graph Change Process

1. Update Cypher schema in `packages/graph/cypher/001_schema.cypher`.
2. Update demo graph in `packages/graph/cypher/002_seed_demo_graph.cypher`.
3. Update sync helpers in `packages/graph/src/index.ts`.
4. Keep Cypher idempotent with `MERGE`, `CREATE CONSTRAINT IF NOT EXISTS`, and `CREATE INDEX IF NOT EXISTS`.
5. Update `packages/graph/README.md` and `docs/DATABASE.md` if the graph shape changes.

## Branch And Pull Request Workflow

- Create feature branches from `main`.
- Keep changes scoped to one task or feature.
- Include tests or explain why tests are not meaningful for the change.
- Keep generated files out of commits unless they are intentionally part of the repo.
- Use pull requests for review before merging to `main`.
- Require CI and build workflows before merge once branch protection is enabled.

## Commit Hygiene

Good commits are:

- Focused.
- Reversible.
- Described with a clear imperative message.
- Free of unrelated generated churn.

Examples:

```text
Add Phase 0 database seed data
Document Neo4j graph sync workflow
Configure CI build workflow
```

## Security Expectations

- Never commit `.env`.
- Never commit real API keys, tokens, private keys, or production credentials.
- Use placeholders in docs and examples.
- Treat local Docker credentials as development-only.
- Review webhook, billing, authentication, and agent execution changes carefully.

## Performance Expectations

- Add indexes for new tenant-scoped query patterns.
- Avoid N+1 graph or database calls in service code.
- Keep event writes append-only and small.
- Use queue workers for slow or external side effects.
- Keep Turborepo scripts cacheable where possible.

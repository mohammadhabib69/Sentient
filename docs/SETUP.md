# Sentient Setup Guide

This guide gets a new developer from a clean checkout to a running local Phase 0 environment.

## Prerequisites

- Node.js 24 or newer
- pnpm 11.3.0 or newer
- Docker Desktop or Docker Engine with Docker Compose v2
- Git
- Optional: `cypher-shell` for applying Neo4j scripts from the host

Check versions:

```bash
node --version
pnpm --version
docker --version
docker compose version
```

## Clone The Repository

```bash
git clone https://github.com/mohammadhabib69/Sentient.git
cd Sentient
```

## Bootstrap Automatically

The fastest path is the setup script:

```bash
./setup.sh
```

The script:

- Checks that Docker and pnpm are available.
- Verifies Docker is running.
- Copies `.env.example` to `.env` when `.env` does not exist.
- Installs dependencies when `node_modules` is missing.
- Starts PostgreSQL/TimescaleDB, Redis, Neo4j, and MinIO.
- Waits for service health checks.
- Runs Prisma migrations.
- Runs the database seed script.

To force `.env` regeneration from `.env.example`:

```bash
OVERWRITE_ENV=1 ./setup.sh
```

## Bootstrap Manually

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start local infrastructure:

```bash
docker compose up -d
```

Development override with logging limits:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Generate the Prisma Client:

```bash
pnpm db:generate
```

Run the initial migration:

```bash
pnpm db:migrate
```

Seed deterministic demo data:

```bash
pnpm db:seed
```

Apply Neo4j schema constraints and demo graph data:

```bash
docker compose exec -T neo4j cypher-shell -u neo4j -p sentient-neo4j-password \
  < packages/graph/cypher/001_schema.cypher

docker compose exec -T neo4j cypher-shell -u neo4j -p sentient-neo4j-password \
  < packages/graph/cypher/002_seed_demo_graph.cypher
```

When running from the host, use:

```bash
cypher-shell -a bolt://localhost:7687 -u neo4j -p sentient-neo4j-password \
  -f packages/graph/cypher/001_schema.cypher

cypher-shell -a bolt://localhost:7687 -u neo4j -p sentient-neo4j-password \
  -f packages/graph/cypher/002_seed_demo_graph.cypher
```

## Local Service URLs

- Web app: `http://localhost:3000`
- Docs app: `http://localhost:3001` when configured to run on a separate port
- PostgreSQL / TimescaleDB: `localhost:5432`
- Redis: `localhost:6379`
- Neo4j Browser: `http://localhost:7474`
- Neo4j Bolt: `bolt://localhost:7687`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Common Commands

Run every development server through Turborepo:

```bash
pnpm dev
```

Run one app or package:

```bash
pnpm --filter @sentient/web dev
pnpm --filter @sentient/docs dev
pnpm --filter @sentient/mobile dev
pnpm --filter @sentient/api dev
```

Validate the workspace:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Database lifecycle:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm --filter @sentient/database db:studio
```

Inspect Docker services:

```bash
docker compose ps
docker compose logs -f postgres
docker compose logs -f neo4j
```

Stop infrastructure:

```bash
docker compose down
```

Stop and remove local persistent data:

```bash
docker compose down -v
```

## Troubleshooting

If Prisma cannot connect to PostgreSQL, confirm Docker health:

```bash
docker compose ps postgres
docker compose exec postgres pg_isready -U sentient -d sentient
```

If Neo4j is not ready, wait for the health check and inspect logs:

```bash
docker compose logs -f neo4j
```

If generated Prisma Client files are stale:

```bash
pnpm db:generate
```

If Turborepo cache appears stale:

```bash
pnpm clean
pnpm install
```

## Security Notes

The checked-in `.env.example` values are for local development only. Before staging or production:

- Replace all placeholder secrets.
- Store secrets in a managed secret store.
- Do not expose PostgreSQL, Redis, Neo4j, or MinIO directly to the public internet.
- Use strong credentials for database, Neo4j, object storage, JWT, Stripe, Resend, and OpenAI.
- Rotate secrets immediately if a real value is committed.

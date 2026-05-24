# Sentient · Phase 0 — System Design

**Phase 0 / 20**

**SENTIENT**

AI-Native Business Reality Engine

**Phase 0 — System Design & Architecture**

| **Version** | 1.0.0 |
| --- | --- |
| **Author** | Mohammad Habib |
| **Status** | In Progress |
| **Created** | May 2026 |
| **Stack** | Next.js · Node.js · PostgreSQL · TimescaleDB · Neo4j · Redis · pgvector · Kubernetes |
| **Duration** | 2 weeks |

## 1. Project Overview

Sentient is an AI-Native Business Reality Engine. It builds a living digital twin of a business and deploys autonomous AI agents to operate it. Unlike passive SaaS tools, Sentient observes business state in real-time, detects patterns, and takes action — with human oversight always in the loop.

| **Project Name** | Sentient |
| --- | --- |
| **Type** | B2B + B2C + Developer Platform (SaaS) |
| **Core Concept** | Autonomous AI agents + Business Knowledge Graph + Event Sourcing |
| **Target Market** | Startups, SMBs, Enterprises — globally |
| **Differentiator** | Not a tool you use — a system that runs your business with human oversight |
| **Solo Timeline** | 10–12 months |

## 2. High-Level System Architecture

Sentient follows a modular monolith architecture for v1 — designed to split into microservices as scale demands. The core principle is event-driven: every action produces an immutable event, enabling full auditability and the Reality Stream feature.

### 2.1 Architecture Layers

**Layer 1 — Client**

- Next.js 14 web app (App Router, SSR + CSR hybrid)
- React Native mobile app — human-in-the-loop approvals
- Developer portal — API docs, webhooks, marketplace

**Layer 2 — API Gateway**

- Nginx — SSL termination, rate limiting, routing
- REST API — internal app operations
- GraphQL API — developer-facing, third-party integrations
- WebSocket gateway — Socket.io realtime events and collaboration

**Layer 3 — Application Services**

- Auth Service — JWT, refresh tokens, OAuth, RBAC + ABAC
- Workspace Service — orgs, projects, tasks, members
- Agent Orchestration — multi-agent coordination via LangChain
- Event Store — immutable event log, CQRS read models
- Graph Service — Neo4j business knowledge graph queries
- Notification Service — email, push, in-app via BullMQ
- Billing Service — Stripe subscriptions + usage metering
- Webhook Service — outbound delivery, retry, signed secrets
- Analytics Service — BI queries on TimescaleDB

**Layer 4 — Data**

- PostgreSQL — primary relational data
- TimescaleDB — time-series event data, analytics
- Neo4j — business knowledge graph (entities + relationships)
- Redis — caching, sessions, pub/sub, BullMQ queues
- pgvector — agent memory vectors, semantic search
- AWS S3 / Supabase — file storage, CDN

**Layer 5 — Infrastructure**

- Docker — containerization
- Kubernetes — orchestration, horizontal pod autoscaling
- GitHub Actions + ArgoCD — CI/CD, GitOps
- Prometheus + Grafana — metrics and alerting
- OpenTelemetry — distributed tracing

## 3. Core Architectural Concepts

### 3.1 Event Sourcing

Every state change is recorded as an immutable event. Current state is derived by replaying event history. This enables the Reality Stream, full audit trails, and time-travel debugging.

Event: `{ id, org_id, type, aggregate_id, aggregate_type, payload, actor_id, actor_type, occurred_at }`

*⚠ Events are append-only. Never update or delete event records.*

### 3.2 CQRS

Write operations go through the event store. Read operations use separate optimized read models built from the event stream — allowing independent scaling of reads and writes.

### 3.3 Business Knowledge Graph

On onboarding, Sentient builds a Neo4j graph of all business entities — people, projects, tasks, decisions, dependencies. Auto-detects bottlenecks and critical paths.

```
(User)-[:ASSIGNED_TO]->(Task)-[:BELONGS_TO]->(Project)-[:UNDER]->(Workspace)
```

### 3.4 Multi-Agent Orchestration

Four built-in LangChain agents with independent memory namespaces (pgvector), tool access, and action queues. All agent actions require human approval before execution by default.

- **Aria (Operations)** — task monitoring, reassignment, deadline prediction
- **Nova (Finance)** — invoice tracking, anomaly detection, payment forecasting
- **Echo (Customer)** — communication analysis, sentiment scoring, escalation
- **Flux (Dev)** — GitHub integration, bug prioritization, deployment suggestions

### 3.5 Human-in-the-Loop

No agent executes an action without human approval. The mobile app is the primary approval interface. Approval requests delivered via push notification with one-tap approve/reject. Unapproved actions expire after a configurable timeout.

## 4. Monorepo Structure (Turborepo)

```
sentient/
├── apps/
│   ├── web/           ← Next.js 14 frontend
│   ├── mobile/        ← React Native app
│   └── docs/          ← Developer docs site
├── packages/
│   ├── api/           ← Express.js backend
│   ├── agents/        ← LangChain agent definitions
│   ├── database/      ← Prisma schema + migrations
│   ├── events/        ← Event store + CQRS
│   ├── graph/         ← Neo4j graph service
│   ├── queue/         ← BullMQ job definitions
│   ├── realtime/      ← Socket.io server
│   ├── webhooks/      ← Webhook engine
│   ├── billing/       ← Stripe integration
│   └── shared/        ← Types, utils, constants
├── infra/
│   ├── docker/
│   ├── k8s/
│   ├── helm/
│   └── terraform/
├── .github/workflows/
├── turbo.json
└── docker-compose.yml
```

## 5. Complete Database Schema

### 5.1 Organizations & Users

**organizations**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK, auto-generated |
| name | text | Display name |
| slug | text | Unique URL-safe identifier |
| plan | enum | free │ pro │ business │ enterprise |
| graph_node_id | text | Neo4j node ID |
| stripe_cust_id | text | Stripe customer ID |
| settings | jsonb | Feature flags, preferences |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated |

**users**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid | FK → organizations.id |
| email | text | Unique per org |
| name | text | Display name |
| avatar_url | text | S3 URL |
| role | enum | super_admin │ org_admin │ manager │ member │ guest |
| attributes | jsonb | ABAC policy attributes |
| password_hash | text | bcrypt, null for OAuth users |
| google_id | text | OAuth provider ID |
| email_verified | boolean | Default false |
| last_active_at | timestamptz | Updated on every request |
| created_at | timestamptz | Auto-set |

**sessions**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| refresh_token | text | Hashed, unique |
| device_info | jsonb | UA, IP, device type |
| expires_at | timestamptz | 30 days |
| revoked | boolean | For logout/invalidation |
| created_at | timestamptz | Auto-set |

### 5.2 Workspaces & Projects

**workspaces**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid | FK → organizations.id |
| name | text | Display name |
| description | text | Optional |
| graph_node_id | text | Neo4j node ID |
| settings | jsonb | Visibility, permissions |
| created_by | uuid | FK → users.id |
| created_at | timestamptz | Auto-set |

**projects**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces.id |
| org_id | uuid | Denormalized for query perf |
| name | text | Project name |
| status | enum | active │ paused │ archived │ completed |
| priority | enum | low │ medium │ high │ critical |
| due_date | date | Optional deadline |
| graph_node_id | text | Neo4j node ID |
| metadata | jsonb | Custom fields |
| created_by | uuid | FK → users.id |
| created_at | timestamptz | Auto-set |

**tasks**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| org_id | uuid | Denormalized |
| title | text | Task title |
| description | text | Rich text (Markdown) |
| status | enum | todo │ in_progress │ review │ done │ blocked |
| priority | enum | low │ medium │ high │ critical |
| assignee_id | uuid | FK → users.id, nullable |
| parent_task_id | uuid | FK → tasks.id (subtasks) |
| due_date | timestamptz | Optional |
| estimated_hours | decimal | AI can set this |
| graph_node_id | text | Neo4j node ID |
| position | int | Kanban card order |
| created_by | uuid | FK → users.id |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated |

### 5.3 AI Agents

**agents**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid | FK → organizations.id |
| name | text | Custom name or default |
| type | enum | operations │ finance │ customer │ dev │ custom |
| config | jsonb | Trigger rules, tool permissions |
| memory_ns | text | pgvector namespace |
| is_active | boolean | Enable/disable |
| approval_mode | enum | always │ auto_low_risk │ never |
| actions_count | bigint | Usage metering |
| created_by | uuid | FK → users.id |
| created_at | timestamptz | Auto-set |

**agent_actions**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| agent_id | uuid | FK → agents.id |
| org_id | uuid | Denormalized |
| action_type | text | e.g. reassign_task, send_email |
| payload | jsonb | Action parameters |
| status | enum | pending │ approved │ rejected │ executed │ failed |
| approved_by | uuid | FK → users.id, nullable |
| approved_at | timestamptz | Nullable |
| executed_at | timestamptz | Nullable |
| result | jsonb | Execution result / error |
| expires_at | timestamptz | Approval timeout |
| created_at | timestamptz | Auto-set |

**agent_memory**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| agent_id | uuid | FK → agents.id |
| namespace | text | Scoped memory bucket |
| content | text | Original text content |
| embedding | vector(1536) | OpenAI text-embedding-3-small |
| metadata | jsonb | Source, timestamp, type |
| created_at | timestamptz | Auto-set |

### 5.4 Event Store (Reality Stream)

**events**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid | FK → organizations.id |
| type | text | e.g. task.created, agent.action.approved |
| aggregate_id | uuid | Entity this event belongs to |
| aggregate_type | text | e.g. task, project, agent |
| payload | jsonb | Event data — immutable |
| actor_id | uuid | FK → users.id or agent_id |
| actor_type | enum | user │ agent │ system |
| version | int | Optimistic concurrency |
| occurred_at | timestamptz | TimescaleDB partition key |

*ℹ This table is converted to a TimescaleDB hypertable partitioned by occurred_at.*

### 5.5 Notifications, Files, Billing

**notifications**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| org_id | uuid | Denormalized |
| type | text | e.g. task_assigned, agent_approval_needed |
| title | text | Short text |
| body | text | Full message |
| data | jsonb | Action links, entity IDs |
| read | boolean | Default false |
| read_at | timestamptz | Nullable |
| created_at | timestamptz | Auto-set |

**files**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid | FK → organizations.id |
| uploaded_by | uuid | FK → users.id |
| entity_type | text | task │ project │ workspace │ profile |
| entity_id | uuid | Polymorphic |
| filename | text | Original name |
| storage_key | text | S3 object key |
| mime_type | text | e.g. application/pdf |
| size_bytes | bigint | File size |
| version | int | Versioning support |
| created_at | timestamptz | Auto-set |

**subscriptions**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid | FK → organizations.id |
| stripe_sub_id | text | Stripe subscription ID |
| plan | enum | free │ pro │ business │ enterprise |
| status | enum | active │ past_due │ canceled │ trialing |
| agent_limit | int | Max concurrent agents |
| actions_limit | bigint | Monthly action quota |
| actions_used | bigint | Current period usage |
| current_period_start | timestamptz | Billing period start |
| current_period_end | timestamptz | Billing period end |

**webhooks**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid | FK → organizations.id |
| name | text | Friendly name |
| url | text | Delivery endpoint |
| events | text[] | Subscribed event types |
| secret | text | HMAC-SHA256 signing secret |
| is_active | boolean | Default true |
| last_triggered | timestamptz | Last successful delivery |
| created_at | timestamptz | Auto-set |

### 5.6 Neo4j Graph Schema

```cypher
// Nodes
(:Organization {id, name, plan})
(:User {id, name, role})
(:Workspace {id, name})
(:Project {id, name, status, priority})
(:Task {id, title, status, priority})
(:Agent {id, name, type})

// Relationships
(User)-[:MEMBER_OF]->(Organization)
(Workspace)-[:BELONGS_TO]->(Organization)
(Project)-[:LIVES_IN]->(Workspace)
(Task)-[:PART_OF]->(Project)
(User)-[:ASSIGNED_TO]->(Task)
(Task)-[:DEPENDS_ON]->(Task)
(Agent)-[:MONITORS]->(Project)
(Agent)-[:ACTED_ON]->(Task)
```

## 6. API Contract Design

### 6.1 Base

- REST API base: `https://api.sentient.app/v1`
- GraphQL: `https://api.sentient.app/graphql`
- WebSocket: `wss://ws.sentient.app`
- All REST responses: `{ success, data, error, meta }`
- All requests: `Authorization: Bearer <access_token>`

### 6.2 Key REST Endpoints

| **Method** | **Path** | **Purpose** |
| --- | --- | --- |
| POST | /auth/register | Create account |
| POST | /auth/login | Email/password login |
| POST | /auth/refresh | Rotate access token |
| POST | /auth/logout | Revoke session |
| GET | /auth/google | OAuth redirect |
| GET | /users/me | Current user profile |
| GET | /workspaces | List workspaces |
| POST | /workspaces | Create workspace |
| GET | /projects | List projects |
| POST | /tasks | Create task |
| PATCH | /tasks/:id | Update task |
| PATCH | /tasks/:id/position | Reorder kanban card |
| GET | /agents | List org agents |
| POST | /agents/:id/activate | Enable agent |
| POST | /agents/actions/:id/approve | Approve agent action |
| POST | /agents/actions/:id/reject | Reject agent action |
| GET | /events | Reality Stream (paginated) |
| GET | /analytics/overview | Dashboard summary stats |
| GET | /webhooks | List webhooks |
| POST | /webhooks | Register webhook |

### 6.3 WebSocket Events

| **Event** | **Direction** | **Payload** |
| --- | --- | --- |
| task.updated | Server → Client | { task_id, changes, actor } |
| agent.action.pending | Server → Client | { action_id, agent_name, description, risk } |
| agent.action.executed | Server → Client | { action_id, result } |
| user.presence | Server → Client | { user_id, status } |
| notification.new | Server → Client | { notification } |
| graph.updated | Server → Client | { affected_nodes } |
| join | Client → Server | { org_id, workspace_id } |

## 7. Local Development Setup

### 7.1 docker-compose Services

| **Service** | **Image** | **Port** | **Purpose** |
| --- | --- | --- | --- |
| postgres | timescale/timescaledb-ha:pg16 | 5432 | Main DB + TimescaleDB |
| redis | redis:7-alpine | 6379 | Cache + queues |
| neo4j | neo4j:5 | 7474, 7687 | Business graph |
| minio | minio/minio | 9000, 9001 | Local S3 storage |

### 7.2 Quick Start

```bash
git clone https://github.com/yourusername/sentient
cd sentient
pnpm install
docker-compose up -d
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### 7.3 Environment Variables

| **Variable** | **Purpose** |
| --- | --- |
| DATABASE_URL | Prisma PostgreSQL connection |
| REDIS_URL | ioredis connection |
| NEO4J_URI | Neo4j bolt connection |
| NEO4J_USER | Neo4j auth |
| NEO4J_PASSWORD | Neo4j auth |
| JWT_SECRET | JWT signing (min 32 chars) |
| JWT_EXPIRES_IN | Access token lifetime — e.g. 15m |
| REFRESH_TOKEN_EXPIRES_IN | Refresh token — e.g. 30d |
| FRONTEND_URL | CORS allowed origin |
| OPENAI_API_KEY | AI features |
| STRIPE_SECRET_KEY | Billing |
| RESEND_API_KEY | Email sending |
| S3_BUCKET | File storage |
| S3_ENDPOINT | MinIO in dev, S3 in prod |

## 8. Phase 0 Checklist

- [ ] Turborepo monorepo initialized — all package folders created
- [ ] docker-compose.yml — all services running locally
- [ ] Prisma schema written — all tables from Section 5
- [ ] First migration run, seed data working
- [ ] pgvector extension enabled
- [ ] TimescaleDB hypertable created for events
- [ ] Neo4j schema constraints defined
- [ ] .env.example fully documented
- [ ] GitHub repo with branch protection on main
- [ ] This system design document finalized and committed

*— End of Phase 0 Document —*

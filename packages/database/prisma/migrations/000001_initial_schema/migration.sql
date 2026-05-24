CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE plan AS ENUM ('free', 'pro', 'business', 'enterprise');
CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'manager', 'member', 'guest');
CREATE TYPE project_status AS ENUM ('active', 'paused', 'archived', 'completed');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE agent_type AS ENUM ('operations', 'finance', 'customer', 'dev', 'custom');
CREATE TYPE approval_mode AS ENUM ('always', 'auto_low_risk', 'never');
CREATE TYPE agent_action_status AS ENUM ('pending', 'approved', 'rejected', 'executed', 'failed');
CREATE TYPE actor_type AS ENUM ('user', 'agent', 'system');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  plan plan NOT NULL DEFAULT 'free',
  graph_node_id text NOT NULL,
  stripe_cust_id text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'member',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  password_hash text,
  google_id text,
  email_verified boolean NOT NULL DEFAULT false,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  refresh_token text NOT NULL,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  graph_node_id text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workspaces_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT workspaces_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  org_id uuid NOT NULL,
  name text NOT NULL,
  status project_status NOT NULL DEFAULT 'active',
  priority priority NOT NULL DEFAULT 'medium',
  due_date date,
  graph_node_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT projects_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT projects_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  org_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'todo',
  priority priority NOT NULL DEFAULT 'medium',
  assignee_id uuid,
  parent_task_id uuid,
  due_date timestamptz,
  estimated_hours decimal(10, 2),
  graph_node_id text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT tasks_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  type agent_type NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  memory_ns text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  approval_mode approval_mode NOT NULL DEFAULT 'always',
  actions_count bigint NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT agents_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT agents_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  org_id uuid NOT NULL,
  action_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status agent_action_status NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  executed_at timestamptz,
  result jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT agent_actions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT agent_actions_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT agent_actions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  namespace text NOT NULL,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT agent_memory_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid NOT NULL,
  actor_type actor_type NOT NULL,
  version integer NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT events_pkey PRIMARY KEY (id, occurred_at),
  CONSTRAINT events_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
);

SELECT create_hypertable('events', 'occurred_at', if_not_exists => TRUE);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT notifications_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  filename text NOT NULL,
  storage_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT files_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  stripe_sub_id text,
  plan plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  agent_limit integer NOT NULL DEFAULT 1,
  actions_limit bigint NOT NULL DEFAULT 100,
  actions_used bigint NOT NULL DEFAULT 0,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  CONSTRAINT subscriptions_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL,
  secret text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT webhooks_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX organizations_slug_key ON organizations(slug);
CREATE UNIQUE INDEX organizations_stripe_cust_id_key ON organizations(stripe_cust_id);
CREATE INDEX organizations_plan_idx ON organizations(plan);

CREATE UNIQUE INDEX users_org_id_email_key ON users(org_id, email);
CREATE INDEX users_org_id_role_idx ON users(org_id, role);
CREATE INDEX users_last_active_at_idx ON users(last_active_at);

CREATE UNIQUE INDEX sessions_refresh_token_key ON sessions(refresh_token);
CREATE INDEX sessions_user_id_revoked_idx ON sessions(user_id, revoked);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE INDEX workspaces_org_id_idx ON workspaces(org_id);
CREATE INDEX workspaces_created_by_idx ON workspaces(created_by);

CREATE INDEX projects_workspace_id_status_idx ON projects(workspace_id, status);
CREATE INDEX projects_org_id_status_idx ON projects(org_id, status);
CREATE INDEX projects_org_id_priority_idx ON projects(org_id, priority);
CREATE INDEX projects_due_date_idx ON projects(due_date);
CREATE INDEX projects_created_by_idx ON projects(created_by);

CREATE INDEX tasks_project_id_status_position_idx ON tasks(project_id, status, position);
CREATE INDEX tasks_org_id_status_idx ON tasks(org_id, status);
CREATE INDEX tasks_org_id_priority_idx ON tasks(org_id, priority);
CREATE INDEX tasks_assignee_id_status_idx ON tasks(assignee_id, status);
CREATE INDEX tasks_parent_task_id_idx ON tasks(parent_task_id);
CREATE INDEX tasks_due_date_idx ON tasks(due_date);
CREATE INDEX tasks_created_by_idx ON tasks(created_by);

CREATE UNIQUE INDEX agents_org_id_memory_ns_key ON agents(org_id, memory_ns);
CREATE INDEX agents_org_id_type_is_active_idx ON agents(org_id, type, is_active);
CREATE INDEX agents_created_by_idx ON agents(created_by);

CREATE INDEX agent_actions_agent_id_status_idx ON agent_actions(agent_id, status);
CREATE INDEX agent_actions_org_id_status_created_at_idx ON agent_actions(org_id, status, created_at);
CREATE INDEX agent_actions_approved_by_idx ON agent_actions(approved_by);
CREATE INDEX agent_actions_expires_at_idx ON agent_actions(expires_at);

CREATE INDEX agent_memory_agent_id_namespace_idx ON agent_memory(agent_id, namespace);
CREATE INDEX agent_memory_namespace_idx ON agent_memory(namespace);
CREATE INDEX agent_memory_embedding_idx
  ON agent_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX events_org_id_occurred_at_idx ON events(org_id, occurred_at);
CREATE INDEX events_aggregate_type_aggregate_id_version_idx ON events(aggregate_type, aggregate_id, version);
CREATE INDEX events_type_occurred_at_idx ON events(type, occurred_at);

CREATE INDEX notifications_user_id_read_created_at_idx ON notifications(user_id, read, created_at);
CREATE INDEX notifications_org_id_created_at_idx ON notifications(org_id, created_at);

CREATE INDEX files_org_id_entity_type_entity_id_idx ON files(org_id, entity_type, entity_id);
CREATE INDEX files_uploaded_by_idx ON files(uploaded_by);
CREATE INDEX files_storage_key_idx ON files(storage_key);

CREATE UNIQUE INDEX subscriptions_stripe_sub_id_key ON subscriptions(stripe_sub_id);
CREATE INDEX subscriptions_org_id_status_idx ON subscriptions(org_id, status);
CREATE INDEX subscriptions_current_period_end_idx ON subscriptions(current_period_end);

CREATE INDEX webhooks_org_id_is_active_idx ON webhooks(org_id, is_active);
CREATE INDEX webhooks_last_triggered_idx ON webhooks(last_triggered);

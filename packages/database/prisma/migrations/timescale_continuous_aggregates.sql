-- Phase 7: TimescaleDB continuous aggregates for analytics.
--
-- These materialize hot analytics queries (task velocity, agent
-- performance, hourly active users) and refresh on a schedule.
--
-- Apply with:
--   docker exec -i sentient-postgres psql -U sentient -d sentient \
--     < prisma/migrations/timescale_continuous_aggregates.sql

-- ─── Daily task velocity per org ─────────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS task_velocity_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', occurred_at) AS bucket,
  org_id,
  COUNT(*) FILTER (WHERE type = 'task.created')        AS tasks_created,
  COUNT(*) FILTER (WHERE type = 'task.status_changed'
    AND payload->>'to' = 'done')                        AS tasks_completed,
  COUNT(*) FILTER (WHERE type = 'task.status_changed'
    AND payload->>'to' = 'blocked')                     AS tasks_blocked
FROM events
WHERE type IN ('task.created', 'task.status_changed')
GROUP BY bucket, org_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('task_velocity_daily',
  start_offset      => INTERVAL '3 days',
  end_offset        => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- ─── Agent performance daily ──────────────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS agent_performance_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', occurred_at) AS bucket,
  org_id,
  payload->>'agentId'               AS agent_id,
  payload->>'agentType'             AS agent_type,
  COUNT(*) FILTER (WHERE type = 'agent.action.created')  AS actions_created,
  COUNT(*) FILTER (WHERE type = 'agent.action.executed') AS actions_executed,
  COUNT(*) FILTER (WHERE type = 'agent.action.failed')   AS actions_failed,
  COUNT(*) FILTER (WHERE type = 'agent.action.rejected') AS actions_rejected
FROM events
WHERE type IN (
  'agent.action.created', 'agent.action.executed',
  'agent.action.failed',  'agent.action.rejected'
)
GROUP BY bucket, org_id, agent_id, agent_type
WITH NO DATA;

SELECT add_continuous_aggregate_policy('agent_performance_daily',
  start_offset      => INTERVAL '3 days',
  end_offset        => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- ─── Hourly active users per org ─────────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS active_users_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', occurred_at) AS bucket,
  org_id,
  COUNT(DISTINCT actor_id)            AS active_user_count
FROM events
WHERE actor_type = 'user'
GROUP BY bucket, org_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('active_users_hourly',
  start_offset      => INTERVAL '3 hours',
  end_offset        => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

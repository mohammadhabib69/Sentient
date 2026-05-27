-- Enable extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert events table to hypertable
SELECT create_hypertable('events', 'occurred_at', if_not_exists => TRUE);

-- Set chunk interval to 7 days
SELECT set_chunk_time_interval('events', INTERVAL '7 days');

-- Create continuous aggregate for hourly event counts
CREATE MATERIALIZED VIEW event_counts_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', occurred_at) AS bucket,
  org_id,
  type,
  COUNT(*) AS count
FROM events
GROUP BY bucket, org_id, type;


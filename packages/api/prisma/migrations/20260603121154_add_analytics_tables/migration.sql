-- Phase 11 — Analytics + BI Dashboard
-- Snapshots, anomalies, forecasts, custom reports, and report executions.
-- All scoped by org_id and indexed for the hot read paths.

-- ─── Task completed_at (used by velocity cycle-time) ─────────────
ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ(6);

-- ─── analytics_snapshots ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "analytics_snapshots" (
  "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
  "org_id"        UUID          NOT NULL,
  "name"          TEXT          NOT NULL,
  "description"   TEXT,
  "snapshot_data" JSONB         NOT NULL DEFAULT '{}'::jsonb,
  "created_by"    UUID,
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "analytics_snapshots_org_id_idx"        ON "analytics_snapshots"("org_id");
CREATE INDEX IF NOT EXISTS "analytics_snapshots_created_at_idx"   ON "analytics_snapshots"("created_at");

-- ─── detected_anomalies ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "detected_anomalies" (
  "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
  "org_id"           UUID          NOT NULL,
  "metric"           TEXT          NOT NULL,
  "severity"         TEXT          NOT NULL DEFAULT 'warning',
  "description"      TEXT          NOT NULL,
  "value"            DOUBLE PRECISION NOT NULL,
  "expected_range"   JSONB         NOT NULL DEFAULT '{}'::jsonb,
  "deviations"       DOUBLE PRECISION NOT NULL,
  "detected_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acknowledged_at"  TIMESTAMPTZ(6),
  "acknowledged_by"  UUID,
  CONSTRAINT "detected_anomalies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "detected_anomalies_org_id_idx"     ON "detected_anomalies"("org_id");
CREATE INDEX IF NOT EXISTS "detected_anomalies_metric_idx"     ON "detected_anomalies"("metric");
CREATE INDEX IF NOT EXISTS "detected_anomalies_severity_idx"   ON "detected_anomalies"("severity");
CREATE INDEX IF NOT EXISTS "detected_anomalies_detected_at_idx" ON "detected_anomalies"("detected_at");

-- ─── forecasts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "forecasts" (
  "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
  "org_id"        UUID          NOT NULL,
  "entity_type"   TEXT          NOT NULL,
  "entity_id"     UUID          NOT NULL,
  "metric"        TEXT          NOT NULL,
  "predictions"   JSONB         NOT NULL DEFAULT '[]'::jsonb,
  "model"         TEXT          NOT NULL,
  "accuracy"      DOUBLE PRECISION NOT NULL,
  "generated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at"    TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "forecasts_org_id_idx"            ON "forecasts"("org_id");
CREATE INDEX IF NOT EXISTS "forecasts_entity_type_id_idx"   ON "forecasts"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "forecasts_expires_at_idx"       ON "forecasts"("expires_at");

-- ─── custom_reports ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "custom_reports" (
  "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
  "org_id"        UUID          NOT NULL,
  "created_by"    UUID          NOT NULL,
  "name"          TEXT          NOT NULL,
  "description"   TEXT,
  "metrics"       TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
  "filters"       JSONB         NOT NULL DEFAULT '{}'::jsonb,
  "is_scheduled"  BOOLEAN       NOT NULL DEFAULT FALSE,
  "schedule_expr" TEXT,
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "custom_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "custom_reports_org_id_idx"      ON "custom_reports"("org_id");
CREATE INDEX IF NOT EXISTS "custom_reports_created_by_idx"  ON "custom_reports"("created_by");

-- ─── report_executions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "report_executions" (
  "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
  "report_id"    UUID          NOT NULL,
  "org_id"       UUID          NOT NULL,
  "status"       TEXT          NOT NULL DEFAULT 'pending',
  "output"       JSONB,
  "file_url"     TEXT,
  "started_at"   TIMESTAMPTZ(6),
  "completed_at" TIMESTAMPTZ(6),
  "error"        TEXT,
  "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "report_executions_report_id_idx"   ON "report_executions"("report_id");
CREATE INDEX IF NOT EXISTS "report_executions_org_id_idx"      ON "report_executions"("org_id");
CREATE INDEX IF NOT EXISTS "report_executions_created_at_idx"  ON "report_executions"("created_at");

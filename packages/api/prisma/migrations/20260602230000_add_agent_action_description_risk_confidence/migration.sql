-- Phase 8 — AI Agent Workforce
-- Add description / riskLevel / confidence columns to agent_actions so
-- the HITL pipeline can carry rich context (human-readable description,
-- LLM risk classification, and agent confidence score).

ALTER TABLE "agent_actions"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "risk_level" TEXT NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS "confidence" DECIMAL(5, 4) NOT NULL DEFAULT 0;

-- ==========================================================
-- Vision Scoring Persistence Tables
-- Stores Claude Vision renovation scores so they persist
-- across sessions and avoid re-paying for the same analysis.
-- ==========================================================

-- Batch tracking: one row per scoring run
CREATE TABLE IF NOT EXISTS gsrealty_scoring_batches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES gsrealty_clients(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'scoring', 'complete', 'error', 'timed_out')),
  total_pages         INTEGER NOT NULL DEFAULT 0,
  total_scored        INTEGER NOT NULL DEFAULT 0,
  total_failed        INTEGER NOT NULL DEFAULT 0,
  total_unmatched     INTEGER NOT NULL DEFAULT 0,
  estimated_cost      NUMERIC(8,4),
  storage_paths       JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_input_tokens  INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  created_by          UUID
);

-- Individual property scores: one row per scored property per client
CREATE TABLE IF NOT EXISTS gsrealty_vision_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id            UUID NOT NULL REFERENCES gsrealty_scoring_batches(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES gsrealty_clients(id) ON DELETE CASCADE,

  -- Address matching
  address             TEXT NOT NULL,
  detected_address    TEXT,
  mls_number          TEXT,
  address_normalized  TEXT NOT NULL,

  -- Score data
  renovation_score    INTEGER NOT NULL CHECK (renovation_score BETWEEN 1 AND 10),
  reno_year_estimate  INTEGER,
  confidence          TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  era_baseline        TEXT,
  reasoning           TEXT,

  -- Detailed breakdown
  rooms               JSONB NOT NULL DEFAULT '[]'::jsonb,
  unit_scores         JSONB,
  dwelling_subtype    TEXT,

  -- PDF context
  page_number         INTEGER NOT NULL,
  source_pdf_path     TEXT,

  -- Model tracking
  model_version       TEXT,

  -- Token usage per property
  input_tokens        INTEGER,
  output_tokens       INTEGER,

  -- Timestamps
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Cache key: one score per address per client (latest wins on upsert)
  CONSTRAINT uq_vision_score_client_address UNIQUE (client_id, address_normalized)
);

-- Failures table for audit trail
CREATE TABLE IF NOT EXISTS gsrealty_scoring_failures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES gsrealty_scoring_batches(id) ON DELETE CASCADE,
  page_number   INTEGER NOT NULL,
  address       TEXT,
  reason        TEXT NOT NULL,
  detail        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for primary query patterns
CREATE INDEX IF NOT EXISTS idx_vision_scores_client
  ON gsrealty_vision_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_vision_scores_batch
  ON gsrealty_vision_scores(batch_id);
CREATE INDEX IF NOT EXISTS idx_vision_scores_address_norm
  ON gsrealty_vision_scores(client_id, address_normalized);
CREATE INDEX IF NOT EXISTS idx_scoring_batches_client
  ON gsrealty_scoring_batches(client_id);
CREATE INDEX IF NOT EXISTS idx_scoring_failures_batch
  ON gsrealty_scoring_failures(batch_id);

-- RLS policies (admin-only access, matching existing gsrealty_* patterns)
ALTER TABLE gsrealty_scoring_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsrealty_vision_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsrealty_scoring_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage scoring batches"
  ON gsrealty_scoring_batches FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage vision scores"
  ON gsrealty_vision_scores FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage scoring failures"
  ON gsrealty_scoring_failures FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

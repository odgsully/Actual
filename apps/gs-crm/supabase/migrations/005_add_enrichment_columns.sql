-- ================================================================
-- Enrichment Outcome Columns for gsrealty_mcao_data
-- Migration: 005
-- Created: February 2026
-- Purpose: Track per-record enrichment outcomes (error codes, method, confidence)
-- Phase 0.5a: Failure persistence for unified enrichment model
-- ================================================================

-- Add enrichment tracking columns
ALTER TABLE public.gsrealty_mcao_data
  ADD COLUMN IF NOT EXISTS enrichment_error_code TEXT,
  ADD COLUMN IF NOT EXISTS enrichment_method TEXT,
  ADD COLUMN IF NOT EXISTS enrichment_confidence DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS enrichment_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS enrichment_success BOOLEAN DEFAULT TRUE;

-- Add comments
COMMENT ON COLUMN public.gsrealty_mcao_data.enrichment_error_code IS 'Unified error code from EnrichmentErrorCode type (e.g. APN_NOT_FOUND, TIMEOUT)';
COMMENT ON COLUMN public.gsrealty_mcao_data.enrichment_method IS 'APN resolution method (exact_where, loose_where, geocode_identify, cached, skipped, not_found)';
COMMENT ON COLUMN public.gsrealty_mcao_data.enrichment_confidence IS 'Confidence score 0.00–1.00';
COMMENT ON COLUMN public.gsrealty_mcao_data.enrichment_duration_ms IS 'Processing time in milliseconds';
COMMENT ON COLUMN public.gsrealty_mcao_data.enrichment_success IS 'Whether enrichment succeeded';

-- Index on error code for failure analysis queries
CREATE INDEX IF NOT EXISTS idx_mcao_enrichment_error_code
  ON public.gsrealty_mcao_data(enrichment_error_code)
  WHERE enrichment_error_code IS NOT NULL;

-- Index on method for resolution analysis
CREATE INDEX IF NOT EXISTS idx_mcao_enrichment_method
  ON public.gsrealty_mcao_data(enrichment_method);

-- ================================================================
-- Batch summary log table
-- Stores one row per enrichment batch run
-- ================================================================

CREATE TABLE IF NOT EXISTS public.gsrealty_enrichment_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total INTEGER NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  apn_only_resolved INTEGER NOT NULL DEFAULT 0,
  apn_failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  retryable INTEGER NOT NULL DEFAULT 0,
  permanent INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL,
  aborted BOOLEAN NOT NULL DEFAULT FALSE,
  abort_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.gsrealty_enrichment_batches IS 'Log of enrichment batch runs with summary statistics';

-- RLS: admin-only access
ALTER TABLE public.gsrealty_enrichment_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to enrichment batches"
ON public.gsrealty_enrichment_batches FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

-- ================================================================
-- GSRealty MCAO Integration Tables
-- Migration: 004
-- Created: October 16, 2025
-- Purpose: Add tables for MCAO property data storage and caching
-- ================================================================

-- TABLE: gsrealty_mcao_data
-- Stores property data from Maricopa County Assessor's Office
CREATE TABLE IF NOT EXISTS public.gsrealty_mcao_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.gsrealty_properties(id) ON DELETE SET NULL,
  apn TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  legal_description TEXT,
  tax_amount DECIMAL(10,2),
  assessed_value DECIMAL(12,2),
  api_response JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.gsrealty_mcao_data IS 'Property data from Maricopa County Assessor Office API';
COMMENT ON COLUMN public.gsrealty_mcao_data.apn IS 'Assessor Parcel Number (unique identifier)';
COMMENT ON COLUMN public.gsrealty_mcao_data.api_response IS 'Full JSONB response from MCAO API';
COMMENT ON COLUMN public.gsrealty_mcao_data.fetched_at IS 'When data was first fetched from MCAO';
COMMENT ON COLUMN public.gsrealty_mcao_data.updated_at IS 'Last update timestamp';

-- Create indexes
CREATE INDEX idx_mcao_apn ON public.gsrealty_mcao_data(apn);
CREATE INDEX idx_mcao_property_id ON public.gsrealty_mcao_data(property_id);
CREATE INDEX idx_mcao_fetched_at ON public.gsrealty_mcao_data(fetched_at);

-- ================================================================
-- Row Level Security (RLS) Policies
-- ================================================================

ALTER TABLE public.gsrealty_mcao_data ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "Admin full access to MCAO data"
ON public.gsrealty_mcao_data FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

-- Clients: Read only their own property data
CREATE POLICY "Clients view own MCAO data"
ON public.gsrealty_mcao_data FOR SELECT
TO authenticated
USING (
  property_id IN (
    SELECT p.id FROM public.gsrealty_properties p
    WHERE p.client_id IN (
      SELECT c.id FROM public.gsrealty_clients c
      WHERE c.user_id = (
        SELECT id FROM public.gsrealty_users
        WHERE auth_user_id = auth.uid()
        AND role = 'client'
      )
    )
  )
);

-- ================================================================
-- Functions for MCAO data management
-- ================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mcao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_update_mcao_timestamp
BEFORE UPDATE ON public.gsrealty_mcao_data
FOR EACH ROW
EXECUTE FUNCTION update_mcao_updated_at();

-- ================================================================
-- Verification Query
-- ================================================================

-- Verify table creation
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'gsrealty_mcao_data';

-- Verify RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'gsrealty_mcao_data'
ORDER BY policyname;

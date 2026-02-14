-- Migration: 005_create_contact_tier_system.sql
-- Purpose: Contact tier management for accountability reports
-- Tiers: none (never), tier2 (monthly), tier1 (weekly)

-- Main contacts table with tier assignment
CREATE TABLE IF NOT EXISTS gs_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core contact fields (from VCF import)
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  organization TEXT,
  note TEXT,

  -- Import tracking
  vcf_id TEXT UNIQUE,  -- Generated from name for deduplication
  imported_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tier assignment
  tier TEXT NOT NULL DEFAULT 'none' CHECK (tier IN ('none', 'tier2', 'tier1')),
  tier_updated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for tier filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_gs_contacts_tier ON gs_contacts(tier);

-- Index for name search
CREATE INDEX IF NOT EXISTS idx_gs_contacts_full_name ON gs_contacts(full_name);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_gs_contacts_email ON gs_contacts(email);

-- Full-text search index for name/email/org combined search
CREATE INDEX IF NOT EXISTS idx_gs_contacts_search ON gs_contacts USING gin(
  to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(organization, ''))
);

-- Enable Row Level Security
ALTER TABLE gs_contacts ENABLE ROW LEVEL SECURITY;

-- Permissive policy for single-user admin dashboard
CREATE POLICY "Full access to gs_contacts" ON gs_contacts
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON gs_contacts TO authenticated;
GRANT ALL ON gs_contacts TO service_role;
GRANT ALL ON gs_contacts TO anon;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gs_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gs_contacts_updated_at
  BEFORE UPDATE ON gs_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_gs_contacts_updated_at();

-- Comment on table
COMMENT ON TABLE gs_contacts IS 'Contact tier management for accountability reports. Imported from Apple Contacts VCF.';
COMMENT ON COLUMN gs_contacts.tier IS 'none=never, tier2=monthly, tier1=weekly accountability reports';

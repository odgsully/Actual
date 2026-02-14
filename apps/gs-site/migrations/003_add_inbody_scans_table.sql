-- InBody Manual Scan Entries
-- Stores body composition data entered manually from gym InBody printouts
--
-- Run this migration in Supabase SQL Editor

-- Create the inbody_scans table
CREATE TABLE IF NOT EXISTS inbody_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',

  -- Scan metadata
  scan_date DATE NOT NULL,
  location_name TEXT,  -- e.g., "LA Fitness Scottsdale"

  -- Core metrics (from InBody printout)
  weight_kg NUMERIC(5,2) NOT NULL,
  body_fat_percent NUMERIC(4,1) NOT NULL,
  skeletal_muscle_mass_kg NUMERIC(5,2) NOT NULL,
  body_fat_mass_kg NUMERIC(5,2),

  -- Derived/calculated metrics
  bmi NUMERIC(4,1),
  bmr INTEGER,  -- Basal Metabolic Rate (kcal)

  -- Additional metrics (optional, depends on InBody model)
  visceral_fat_level INTEGER,  -- 1-20 scale
  inbody_score INTEGER,  -- 0-100 overall score
  total_body_water_l NUMERIC(4,1),

  -- Segmental analysis (optional JSON for flexibility)
  segmental_data JSONB,

  -- Notes and source tracking
  notes TEXT,
  source TEXT DEFAULT 'manual',  -- 'manual', 'api', 'import'
  notion_page_id TEXT,  -- Link back to Notion if synced

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_inbody_scans_user_date
  ON inbody_scans(user_id, scan_date DESC);

CREATE INDEX IF NOT EXISTS idx_inbody_scans_created
  ON inbody_scans(created_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_inbody_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inbody_scans_updated_at ON inbody_scans;
CREATE TRIGGER trigger_inbody_scans_updated_at
  BEFORE UPDATE ON inbody_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_inbody_scans_updated_at();

-- Enable Row Level Security (optional, for multi-user future)
ALTER TABLE inbody_scans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own scans
CREATE POLICY "Users can view own inbody scans" ON inbody_scans
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true) OR user_id = 'default-user');

CREATE POLICY "Users can insert own inbody scans" ON inbody_scans
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true) OR user_id = 'default-user');

CREATE POLICY "Users can update own inbody scans" ON inbody_scans
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true) OR user_id = 'default-user');

CREATE POLICY "Users can delete own inbody scans" ON inbody_scans
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true) OR user_id = 'default-user');

-- Grant access to authenticated and anon roles (adjust as needed)
GRANT ALL ON inbody_scans TO authenticated;
GRANT ALL ON inbody_scans TO anon;
GRANT ALL ON inbody_scans TO service_role;

-- Comment on table
COMMENT ON TABLE inbody_scans IS 'Manual InBody body composition scan entries from gym visits';

-- Migration: Create tile_settings table for GS Site Admin Dashboard
-- Run this in Supabase SQL Editor

-- =============================================================================
-- tile_settings table
-- Stores configurable settings for tiles in the GS Site dashboard
-- =============================================================================

CREATE TABLE IF NOT EXISTS tile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tile identifier (matches keys in tile-settings.ts)
  tile_id TEXT NOT NULL UNIQUE,

  -- Human-readable tile name
  tile_name TEXT NOT NULL,

  -- Settings stored as JSON (flexible for different tile types)
  -- Example settings by tile_id:
  -- 'realtyone-events': { "notionUrl": "https://notion.so/..." }
  -- 'days-till-counter': { "targetDate": "2025-03-01", "label": "Conference" }
  -- 'codebase-duolingo': { "difficulty": 2 }
  -- 'memento-morri': { "color": "#000000" }
  settings JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for quick lookups by tile_id
CREATE INDEX IF NOT EXISTS idx_tile_settings_tile_id ON tile_settings(tile_id);

-- Create index for JSON queries on settings
CREATE INDEX IF NOT EXISTS idx_tile_settings_settings ON tile_settings USING gin(settings);

-- Enable Row Level Security
ALTER TABLE tile_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin access)
-- In production, you may want to restrict this to specific admin roles
CREATE POLICY "Admin can manage tile settings" ON tile_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions to authenticated users
GRANT ALL ON tile_settings TO authenticated;

-- Also allow service role full access
GRANT ALL ON tile_settings TO service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tile_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tile_settings_timestamp ON tile_settings;
CREATE TRIGGER update_tile_settings_timestamp
  BEFORE UPDATE ON tile_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tile_settings_updated_at();

-- =============================================================================
-- Helper function to get or create tile settings
-- =============================================================================

CREATE OR REPLACE FUNCTION get_or_create_tile_settings(
  p_tile_id TEXT,
  p_tile_name TEXT DEFAULT '',
  p_default_settings JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_settings JSONB;
BEGIN
  -- Try to get existing settings
  SELECT settings INTO v_settings
  FROM tile_settings
  WHERE tile_id = p_tile_id;

  -- If not found, create with defaults
  IF v_settings IS NULL THEN
    INSERT INTO tile_settings (tile_id, tile_name, settings)
    VALUES (p_tile_id, COALESCE(NULLIF(p_tile_name, ''), p_tile_id), p_default_settings)
    ON CONFLICT (tile_id) DO NOTHING
    RETURNING settings INTO v_settings;

    -- If still null (race condition), fetch again
    IF v_settings IS NULL THEN
      SELECT settings INTO v_settings
      FROM tile_settings
      WHERE tile_id = p_tile_id;
    END IF;
  END IF;

  RETURN COALESCE(v_settings, p_default_settings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Seed default tile settings
-- =============================================================================

INSERT INTO tile_settings (tile_id, tile_name, settings) VALUES
  ('realtyone-events', '10. RealtyOne Events button', '{"notionUrl": ""}'),
  ('days-till-counter', '13. Panel for Days Till…', '{"targetDate": "", "label": "Target Date"}'),
  ('eating-challenges', '5. Create Eating Challenges', '{"inventoryList": []}'),
  ('codebase-duolingo', 'Codebase Duolingo', '{"difficulty": 2}'),
  ('days-since-bloodwork', 'Days since bloodwork done', '{"startDate": ""}'),
  ('morning-form', 'Morning Form', '{"videoDurationSeconds": 300}'),
  ('memento-morri', 'Memento Morri', '{"color": "#000000"}'),
  ('random-contact', '2. Random Daily Contact', '{"enabledCrmTags": ["client", "lead", "partner"]}'),
  ('accountability-report', 'Accountability Report', '{"circleEmails": [], "frequency": "weekly"}')
ON CONFLICT (tile_id) DO NOTHING;

COMMENT ON TABLE tile_settings IS 'Configurable settings for GS Site dashboard tiles';
COMMENT ON COLUMN tile_settings.tile_id IS 'Unique identifier matching frontend tile configuration';
COMMENT ON COLUMN tile_settings.settings IS 'JSON object containing tile-specific settings';

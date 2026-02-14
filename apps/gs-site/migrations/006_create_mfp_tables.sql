-- Migration: 006_create_mfp_tables
-- Description: MyFitnessPal integration tables for food diary, measurements, and exercise tracking
-- Created: 2026-01-01

-- ============================================================
-- MFP Food Diary (daily aggregates)
-- ============================================================
CREATE TABLE IF NOT EXISTS mfp_food_diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  date DATE NOT NULL,

  -- Macro totals
  calories INTEGER,
  carbs_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),
  protein_g DECIMAL(10,2),
  fiber_g DECIMAL(10,2),
  sugar_g DECIMAL(10,2),
  sodium_mg DECIMAL(10,2),

  -- Goals (from MFP settings)
  calorie_goal INTEGER,
  carbs_goal_g DECIMAL(10,2),
  fat_goal_g DECIMAL(10,2),
  protein_goal_g DECIMAL(10,2),

  -- Metadata
  meals_logged INTEGER DEFAULT 0,
  water_cups INTEGER DEFAULT 0,
  raw_data JSONB,  -- Full meal breakdown if needed

  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- ============================================================
-- MFP Measurements (weight, body fat, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS mfp_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  date DATE NOT NULL,

  -- Core measurements
  weight_lbs DECIMAL(10,2),
  weight_kg DECIMAL(10,2),

  -- Body measurements
  body_fat_percent DECIMAL(5,2),
  waist_cm DECIMAL(10,2),
  hips_cm DECIMAL(10,2),
  chest_cm DECIMAL(10,2),
  neck_cm DECIMAL(10,2),

  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- ============================================================
-- MFP Exercise entries
-- ============================================================
CREATE TABLE IF NOT EXISTS mfp_exercise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  date DATE NOT NULL,

  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  exercise_type TEXT,  -- cardio, strength, etc.

  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MFP Sync Status tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS mfp_sync_status (
  user_id TEXT PRIMARY KEY DEFAULT 'default-user',

  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,  -- 'success', 'failed', 'session_expired', 'in_progress'
  last_sync_error TEXT,
  days_synced INTEGER DEFAULT 0,

  -- Track what date ranges we've synced
  earliest_date DATE,
  latest_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mfp_food_diary_user_date ON mfp_food_diary(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mfp_food_diary_date ON mfp_food_diary(date DESC);
CREATE INDEX IF NOT EXISTS idx_mfp_measurements_user_date ON mfp_measurements(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mfp_measurements_date ON mfp_measurements(date DESC);
CREATE INDEX IF NOT EXISTS idx_mfp_exercise_user_date ON mfp_exercise(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mfp_exercise_date ON mfp_exercise(date DESC);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE mfp_food_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfp_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfp_exercise ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfp_sync_status ENABLE ROW LEVEL SECURITY;

-- Policies for mfp_food_diary
CREATE POLICY "Allow all access to mfp_food_diary" ON mfp_food_diary
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for mfp_measurements
CREATE POLICY "Allow all access to mfp_measurements" ON mfp_measurements
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for mfp_exercise
CREATE POLICY "Allow all access to mfp_exercise" ON mfp_exercise
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for mfp_sync_status
CREATE POLICY "Allow all access to mfp_sync_status" ON mfp_sync_status
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Updated_at trigger for sync status
-- ============================================================
CREATE OR REPLACE FUNCTION update_mfp_sync_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mfp_sync_status_updated_at
  BEFORE UPDATE ON mfp_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_mfp_sync_status_updated_at();

-- ============================================================
-- Table Comments
-- ============================================================
COMMENT ON TABLE mfp_food_diary IS 'Daily food diary aggregates from MyFitnessPal';
COMMENT ON TABLE mfp_measurements IS 'Weight and body measurements from MyFitnessPal';
COMMENT ON TABLE mfp_exercise IS 'Exercise entries from MyFitnessPal';
COMMENT ON TABLE mfp_sync_status IS 'Tracks sync status for MyFitnessPal integration';

COMMENT ON COLUMN mfp_food_diary.raw_data IS 'Full meal breakdown JSON for detailed view';
COMMENT ON COLUMN mfp_food_diary.meals_logged IS 'Count of meals logged (breakfast/lunch/dinner/snacks)';
COMMENT ON COLUMN mfp_sync_status.last_sync_status IS 'success | failed | session_expired | in_progress';

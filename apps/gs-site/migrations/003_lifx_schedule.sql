-- LIFX Schedule Integration Tables
-- Enables morning sunrise and evening lock behavior tied to form check-ins

-- ============================================================
-- Table: lifx_schedule_state
-- Stores daily state for LIFX schedule (one row per day)
-- ============================================================
CREATE TABLE IF NOT EXISTS lifx_schedule_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE, -- YYYY-MM-DD, one row per day

  -- Morning sunrise state
  morning_sunrise_started BOOLEAN DEFAULT FALSE,
  morning_sunrise_start_time TIMESTAMPTZ,
  morning_form_submitted BOOLEAN DEFAULT FALSE,
  morning_form_submitted_at TIMESTAMPTZ,
  morning_lights_off BOOLEAN DEFAULT FALSE,

  -- Evening lock state
  evening_lock_started BOOLEAN DEFAULT FALSE,
  evening_lock_start_time TIMESTAMPTZ,
  evening_form_submitted BOOLEAN DEFAULT FALSE,
  evening_form_submitted_at TIMESTAMPTZ,
  evening_lights_off BOOLEAN DEFAULT FALSE,

  -- Controller lock state
  controller_locked BOOLEAN DEFAULT FALSE,
  lock_reason TEXT, -- 'evening_checkin' | null

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_lifx_schedule_date ON lifx_schedule_state(date);

-- ============================================================
-- Table: lifx_schedule_config
-- Stores configurable schedule settings
-- ============================================================
CREATE TABLE IF NOT EXISTS lifx_schedule_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Morning sunrise settings
  morning_start_hour INTEGER DEFAULT 6,     -- 6 AM
  morning_start_minute INTEGER DEFAULT 0,
  morning_end_hour INTEGER DEFAULT 9,       -- 9 AM (full brightness)
  morning_end_minute INTEGER DEFAULT 0,
  morning_color TEXT DEFAULT 'kelvin:3000', -- Warm sunrise color

  -- Evening lock settings
  evening_lock_hour INTEGER DEFAULT 20,     -- 8 PM
  evening_lock_minute INTEGER DEFAULT 30,   -- 8:30 PM
  evening_lock_color TEXT DEFAULT 'purple',
  evening_lock_brightness NUMERIC DEFAULT 0.7,

  -- Reset time
  reset_hour INTEGER DEFAULT 0,             -- Midnight
  reset_minute INTEGER DEFAULT 0,

  -- Selector for which lights to control
  lifx_selector TEXT DEFAULT 'all',

  -- Feature toggles
  morning_enabled BOOLEAN DEFAULT TRUE,
  evening_enabled BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE lifx_schedule_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifx_schedule_config ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (single-user dashboard)
CREATE POLICY "Allow all for lifx_schedule_state" ON lifx_schedule_state
  FOR ALL USING (true);

CREATE POLICY "Allow all for lifx_schedule_config" ON lifx_schedule_config
  FOR ALL USING (true);

-- ============================================================
-- Insert default config row
-- ============================================================
INSERT INTO lifx_schedule_config (
  morning_start_hour,
  morning_start_minute,
  morning_end_hour,
  morning_end_minute,
  morning_color,
  evening_lock_hour,
  evening_lock_minute,
  evening_lock_color,
  evening_lock_brightness,
  lifx_selector,
  morning_enabled,
  evening_enabled
) VALUES (
  6, 0,           -- 6:00 AM start
  9, 0,           -- 9:00 AM end (100% brightness)
  'kelvin:3000',  -- Warm white for sunrise
  20, 30,         -- 8:30 PM lock
  'purple',       -- Purple for evening
  0.7,            -- 70% brightness
  'all',          -- Control all lights
  TRUE, TRUE      -- Both features enabled
) ON CONFLICT DO NOTHING;

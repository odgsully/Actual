-- Add form opacity timing columns to lifx_schedule_config
-- These control when morning/evening form tiles fade in

-- ============================================================
-- Add morning form timing columns
-- ============================================================
ALTER TABLE lifx_schedule_config
ADD COLUMN IF NOT EXISTS morning_form_start_hour INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS morning_form_start_minute INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS morning_form_end_hour INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS morning_form_end_minute INTEGER DEFAULT 0;

-- ============================================================
-- Add evening form timing columns
-- ============================================================
ALTER TABLE lifx_schedule_config
ADD COLUMN IF NOT EXISTS evening_form_start_hour INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS evening_form_start_minute INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS evening_form_end_hour INTEGER DEFAULT 21,
ADD COLUMN IF NOT EXISTS evening_form_end_minute INTEGER DEFAULT 0;

-- ============================================================
-- Update existing config row with default values
-- ============================================================
UPDATE lifx_schedule_config
SET
  morning_form_start_hour = COALESCE(morning_form_start_hour, 5),
  morning_form_start_minute = COALESCE(morning_form_start_minute, 0),
  morning_form_end_hour = COALESCE(morning_form_end_hour, 8),
  morning_form_end_minute = COALESCE(morning_form_end_minute, 0),
  evening_form_start_hour = COALESCE(evening_form_start_hour, 18),
  evening_form_start_minute = COALESCE(evening_form_start_minute, 0),
  evening_form_end_hour = COALESCE(evening_form_end_hour, 21),
  evening_form_end_minute = COALESCE(evening_form_end_minute, 0),
  updated_at = NOW();

-- ============================================================
-- Add comments for documentation
-- ============================================================
COMMENT ON COLUMN lifx_schedule_config.morning_form_start_hour IS 'Hour (0-23) when morning form opacity starts rising from 0%';
COMMENT ON COLUMN lifx_schedule_config.morning_form_start_minute IS 'Minute (0-59) when morning form opacity starts rising';
COMMENT ON COLUMN lifx_schedule_config.morning_form_end_hour IS 'Hour (0-23) when morning form reaches 100% opacity';
COMMENT ON COLUMN lifx_schedule_config.morning_form_end_minute IS 'Minute (0-59) when morning form reaches 100% opacity';
COMMENT ON COLUMN lifx_schedule_config.evening_form_start_hour IS 'Hour (0-23) when evening form opacity starts rising from 0%';
COMMENT ON COLUMN lifx_schedule_config.evening_form_start_minute IS 'Minute (0-59) when evening form opacity starts rising';
COMMENT ON COLUMN lifx_schedule_config.evening_form_end_hour IS 'Hour (0-23) when evening form reaches 100% opacity';
COMMENT ON COLUMN lifx_schedule_config.evening_form_end_minute IS 'Minute (0-59) when evening form reaches 100% opacity';

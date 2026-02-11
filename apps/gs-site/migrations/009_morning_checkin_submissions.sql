-- Migration: Create morning_checkin_submissions table for GS Site
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS morning_checkin_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL UNIQUE,
  weight NUMERIC(5,1),
  teeth_grind_rating INTEGER CHECK (teeth_grind_rating >= 1 AND teeth_grind_rating <= 5),
  retainer BOOLEAN DEFAULT FALSE,
  shoulder_measurement NUMERIC(5,1),
  thigh_measurement NUMERIC(5,1),
  video_recorded BOOLEAN DEFAULT FALSE,
  body_photo_taken BOOLEAN DEFAULT FALSE,
  face_photo_taken BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_morning_checkin_entry_date
  ON morning_checkin_submissions(entry_date DESC);

-- Reuse existing updated_at trigger function from migration 001
DROP TRIGGER IF EXISTS update_morning_checkin_updated_at ON morning_checkin_submissions;
CREATE TRIGGER update_morning_checkin_updated_at
  BEFORE UPDATE ON morning_checkin_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS with allow-all policy (single-user dashboard)
ALTER TABLE morning_checkin_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for morning_checkin_submissions" ON morning_checkin_submissions
  FOR ALL USING (true);

COMMENT ON TABLE morning_checkin_submissions IS 'Daily morning check-in form submissions for GS Site';

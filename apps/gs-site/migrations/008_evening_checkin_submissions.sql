-- Migration: Create evening_checkin_submissions table for GS Site
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS evening_checkin_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL UNIQUE,
  deep_work_hours NUMERIC(4,1),
  accomplishments TEXT,
  improvements TEXT,
  day_rating INTEGER CHECK (day_rating >= 1 AND day_rating <= 5),
  food_tracked BOOLEAN DEFAULT FALSE,
  habitat_photo_count INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_evening_checkin_entry_date ON evening_checkin_submissions(entry_date DESC);

-- Reuse existing updated_at trigger function from migration 001
DROP TRIGGER IF EXISTS update_evening_checkin_updated_at ON evening_checkin_submissions;
CREATE TRIGGER update_evening_checkin_updated_at
  BEFORE UPDATE ON evening_checkin_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS with allow-all policy (single-user dashboard)
ALTER TABLE evening_checkin_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for evening_checkin_submissions" ON evening_checkin_submissions
  FOR ALL USING (true);

COMMENT ON TABLE evening_checkin_submissions IS 'Daily evening check-in form submissions for GS Site';

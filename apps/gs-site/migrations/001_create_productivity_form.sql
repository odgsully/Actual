-- Migration: Create productivity_form_submissions table for GS Site
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS productivity_form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Page 1 fields
  entry_date DATE NOT NULL,
  entry_time TEXT[] NOT NULL, -- Array for multiple selections: noon, 2:45pm, 5:45pm, other
  entry_time_other TEXT, -- Custom time if "other" selected

  -- Page 2 fields - Deep Work Hours
  deep_work_noon TEXT,
  deep_work_245pm TEXT,
  deep_work_545pm TEXT,
  deep_work_eod TEXT,

  -- Reflection fields
  what_got_done TEXT,
  improve_how TEXT,

  -- Multi-select checkboxes
  clean_desk BOOLEAN DEFAULT FALSE,
  clean_desktop BOOLEAN DEFAULT FALSE,

  -- PDF tracking
  pdf_status TEXT, -- 'yes', 'yes_added', or null
  pdfs_added TEXT, -- Description of PDFs added

  -- Rating fields (1-5 scale)
  notion_calendar_grade INTEGER NOT NULL CHECK (notion_calendar_grade >= 1 AND notion_calendar_grade <= 5),
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),

  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_productivity_form_entry_date ON productivity_form_submissions(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_productivity_form_submitted_at ON productivity_form_submissions(submitted_at DESC);

-- Enable Row Level Security (optional - enable if you want user-specific access)
-- ALTER TABLE productivity_form_submissions ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_productivity_form_updated_at ON productivity_form_submissions;
CREATE TRIGGER update_productivity_form_updated_at
  BEFORE UPDATE ON productivity_form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your auth setup)
-- For public anonymous access (forms without auth):
-- GRANT INSERT ON productivity_form_submissions TO anon;
-- GRANT SELECT ON productivity_form_submissions TO anon;

-- For authenticated users only:
-- GRANT ALL ON productivity_form_submissions TO authenticated;

COMMENT ON TABLE productivity_form_submissions IS 'Daily productivity accountability form submissions for GS Site';

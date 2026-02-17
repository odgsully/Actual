-- Jarvis_BriefMe Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the required tables

-- ============================================================================
-- MAIN BRIEFINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS jarvis_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_date DATE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_json JSONB NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE jarvis_briefings IS 'Stores daily intelligence briefings from Jarvis_BriefMe';
COMMENT ON COLUMN jarvis_briefings.briefing_date IS 'Unique date of the briefing (one per day)';
COMMENT ON COLUMN jarvis_briefings.content_json IS 'Structured JSON content with sections, sources, etc.';
COMMENT ON COLUMN jarvis_briefings.content_html IS 'Full HTML formatted content';
COMMENT ON COLUMN jarvis_briefings.content_text IS 'Plain text version for search/indexing';
COMMENT ON COLUMN jarvis_briefings.metadata IS 'Additional metadata: sources, categories, word count, etc.';
COMMENT ON COLUMN jarvis_briefings.pdf_url IS 'URL to PDF version in Supabase Storage';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for date-based queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_jarvis_briefings_date
  ON jarvis_briefings(briefing_date DESC);

-- Index for metadata searches (e.g., filter by category, source)
CREATE INDEX IF NOT EXISTS idx_jarvis_briefings_metadata
  ON jarvis_briefings USING GIN (metadata);

-- Full-text search index on plain text content
CREATE INDEX IF NOT EXISTS idx_jarvis_briefings_text_search
  ON jarvis_briefings USING GIN (to_tsvector('english', content_text));

-- Index for creation time queries
CREATE INDEX IF NOT EXISTS idx_jarvis_briefings_created
  ON jarvis_briefings(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (OPTIONAL - RECOMMENDED FOR PRODUCTION)
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE jarvis_briefings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read briefings
CREATE POLICY "Allow authenticated users to read briefings"
  ON jarvis_briefings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow service role to insert/update/delete (for Jarvis background job)
CREATE POLICY "Allow service role full access"
  ON jarvis_briefings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: (Optional) Allow specific user to manage briefings
-- Uncomment and modify if you want user-specific access:
-- CREATE POLICY "Allow owner to manage briefings"
--   ON jarvis_briefings
--   FOR ALL
--   TO authenticated
--   USING (auth.uid() = (metadata->>'owner_id')::UUID)
--   WITH CHECK (auth.uid() = (metadata->>'owner_id')::UUID);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

-- Create trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_jarvis_briefings_updated_at ON jarvis_briefings;
CREATE TRIGGER update_jarvis_briefings_updated_at
  BEFORE UPDATE ON jarvis_briefings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get briefings within a date range
CREATE OR REPLACE FUNCTION get_briefings_by_date_range(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  id UUID,
  briefing_date DATE,
  title TEXT,
  content_json JSONB,
  pdf_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.briefing_date,
    b.title,
    b.content_json,
    b.pdf_url,
    b.metadata,
    b.created_at
  FROM jarvis_briefings b
  WHERE b.briefing_date BETWEEN start_date AND end_date
  ORDER BY b.briefing_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to search briefings by text
CREATE OR REPLACE FUNCTION search_briefings(search_query TEXT)
RETURNS TABLE (
  id UUID,
  briefing_date DATE,
  title TEXT,
  content_text TEXT,
  pdf_url TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.briefing_date,
    b.title,
    b.content_text,
    b.pdf_url,
    ts_rank(to_tsvector('english', b.content_text), plainto_tsquery('english', search_query)) AS rank
  FROM jarvis_briefings b
  WHERE to_tsvector('english', b.content_text) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, b.briefing_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest briefing
CREATE OR REPLACE FUNCTION get_latest_briefing()
RETURNS TABLE (
  id UUID,
  briefing_date DATE,
  title TEXT,
  content_json JSONB,
  content_html TEXT,
  pdf_url TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.briefing_date,
    b.title,
    b.content_json,
    b.content_html,
    b.pdf_url,
    b.metadata
  FROM jarvis_briefings b
  ORDER BY b.briefing_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STORAGE BUCKET SETUP (Run in Supabase Dashboard or via SQL)
-- ============================================================================

-- Note: Storage buckets are typically created via Supabase Dashboard,
-- but you can also create them programmatically:

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('jarvis-briefings', 'jarvis-briefings', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket (allow public read, service role write)
-- CREATE POLICY "Public Access for PDFs"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'jarvis-briefings');

-- CREATE POLICY "Service Role Upload PDFs"
--   ON storage.objects FOR INSERT
--   TO service_role
--   WITH CHECK (bucket_id = 'jarvis-briefings');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table was created
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'jarvis_briefings';

-- Verify indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'jarvis_briefings';

-- Verify functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'get_briefings_by_date_range',
  'search_briefings',
  'get_latest_briefing'
);

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get latest 10 briefings
-- SELECT briefing_date, title, pdf_url
-- FROM jarvis_briefings
-- ORDER BY briefing_date DESC
-- LIMIT 10;

-- Search briefings containing "crypto"
-- SELECT * FROM search_briefings('crypto');

-- Get briefings from last 30 days
-- SELECT * FROM get_briefings_by_date_range(
--   CURRENT_DATE - INTERVAL '30 days',
--   CURRENT_DATE
-- );

-- Get latest briefing
-- SELECT * FROM get_latest_briefing();

-- ============================================================================
-- CLEANUP (USE WITH CAUTION - DELETES ALL DATA)
-- ============================================================================

-- DROP TABLE IF EXISTS jarvis_briefings CASCADE;
-- DROP FUNCTION IF EXISTS get_briefings_by_date_range(DATE, DATE);
-- DROP FUNCTION IF EXISTS search_briefings(TEXT);
-- DROP FUNCTION IF EXISTS get_latest_briefing();
-- DROP FUNCTION IF EXISTS update_updated_at_column();

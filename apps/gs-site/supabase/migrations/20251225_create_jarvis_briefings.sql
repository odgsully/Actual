-- Migration: Create jarvis_briefings table for Jarvis_BriefMe integration
-- Description: Stores daily AI-generated briefings with structured content (news, repos, history, etc.)
-- Created: 2025-12-25

-- Create the jarvis_briefings table
CREATE TABLE IF NOT EXISTS public.jarvis_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  title TEXT,
  content_json JSONB,
  content_html TEXT,
  content_text TEXT,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.jarvis_briefings IS 'Stores daily Jarvis briefings with structured content sections including news, GitHub repos, countries, history, languages, and other curated information';

-- Add column comments
COMMENT ON COLUMN public.jarvis_briefings.date IS 'The briefing date (unique constraint ensures one briefing per day)';
COMMENT ON COLUMN public.jarvis_briefings.title IS 'Briefing title or subject line';
COMMENT ON COLUMN public.jarvis_briefings.content_json IS 'Structured briefing content with sections: news, repos, countries, history, languages, etc.';
COMMENT ON COLUMN public.jarvis_briefings.content_html IS 'Rendered HTML version for display';
COMMENT ON COLUMN public.jarvis_briefings.content_text IS 'Plain text version for fallback/email';
COMMENT ON COLUMN public.jarvis_briefings.pdf_url IS 'Supabase Storage URL for generated PDF';
COMMENT ON COLUMN public.jarvis_briefings.metadata IS 'Generation metadata: source counts, processing stats, AI model info, etc.';

-- Create indexes for performance
CREATE INDEX idx_jarvis_briefings_date ON public.jarvis_briefings(date DESC);
CREATE INDEX idx_jarvis_briefings_created_at ON public.jarvis_briefings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.jarvis_briefings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read all briefings
CREATE POLICY "Allow authenticated users to read briefings"
  ON public.jarvis_briefings
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow public (unauthenticated) read access for public sharing
CREATE POLICY "Allow public read access to briefings"
  ON public.jarvis_briefings
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policy: Only service role can insert briefings
CREATE POLICY "Service role can insert briefings"
  ON public.jarvis_briefings
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policy: Only service role can update briefings
CREATE POLICY "Service role can update briefings"
  ON public.jarvis_briefings
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Only service role can delete briefings
CREATE POLICY "Service role can delete briefings"
  ON public.jarvis_briefings
  FOR DELETE
  TO service_role
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_jarvis_briefings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function on update
CREATE TRIGGER update_jarvis_briefings_updated_at
  BEFORE UPDATE ON public.jarvis_briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_jarvis_briefings_updated_at();

-- Grant necessary permissions
GRANT SELECT ON public.jarvis_briefings TO authenticated;
GRANT SELECT ON public.jarvis_briefings TO anon;
GRANT ALL ON public.jarvis_briefings TO service_role;

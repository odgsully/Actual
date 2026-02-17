-- Migration: Create context_dump tables for GS Site
-- Run this in Supabase SQL Editor
--
-- Two tables:
-- 1. context_dump_submissions - daily entries (goals + clarifying answers)
-- 2. context_dump_questions - question bank for rotating clarifying questions

-- ============================================================
-- context_dump_submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS context_dump_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL UNIQUE,
  goals TEXT NOT NULL,
  clarifying_answers JSONB DEFAULT '[]'::jsonb,
  -- Each answer: { "question": "...", "answer": "..." }
  github_commit_sha TEXT,
  -- SHA of the commit to contextdump-actions/ (null if commit failed)
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_context_dump_entry_date
  ON context_dump_submissions(entry_date DESC);

DROP TRIGGER IF EXISTS update_context_dump_updated_at ON context_dump_submissions;
CREATE TRIGGER update_context_dump_updated_at
  BEFORE UPDATE ON context_dump_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS with allow-all policy (single-user dashboard)
ALTER TABLE context_dump_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for context_dump_submissions" ON context_dump_submissions
  FOR ALL USING (true);

COMMENT ON TABLE context_dump_submissions IS 'Daily context dump form submissions - goals and clarifying answers about the monorepo';

-- ============================================================
-- context_dump_questions
-- ============================================================
CREATE TABLE IF NOT EXISTS context_dump_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  -- Categories: general, wabbit, gs-site, gs-crm, wabbit-re, infrastructure
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_context_dump_questions_active
  ON context_dump_questions(is_active, last_used_at ASC NULLS FIRST);

ALTER TABLE context_dump_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for context_dump_questions" ON context_dump_questions
  FOR ALL USING (true);

COMMENT ON TABLE context_dump_questions IS 'Question bank for daily context dump clarifying questions';

-- ============================================================
-- Seed initial questions (fallback when AI generation is not configured)
-- ============================================================
INSERT INTO context_dump_questions (question, category) VALUES
  ('What is the highest priority task across the monorepo right now?', 'general'),
  ('Are there any blockers preventing progress on current work?', 'general'),
  ('What decision needs to be made soon that you have been putting off?', 'general'),
  ('Is there any technical debt that is slowing you down?', 'general'),
  ('What should be shipped this week?', 'general'),
  ('What feature or fix would have the most user impact right now?', 'general'),
  ('Are there any dependencies between apps that need coordination?', 'infrastructure'),
  ('What is the next milestone for Wabbit (content ranking tool)?', 'wabbit'),
  ('What Wave 5/7 items should be prioritized next for Wabbit?', 'wabbit'),
  ('What GS Site tiles need attention or are broken?', 'gs-site'),
  ('Are there any GS Site integrations that need reconnecting?', 'gs-site'),
  ('What is the next step for GS CRM onboarding and auth?', 'gs-crm'),
  ('Are there any Supabase migrations pending that need to be run?', 'infrastructure'),
  ('What deployment or DNS issues need resolving?', 'infrastructure'),
  ('Is there anything you learned today that should be documented?', 'general'),
  ('What would you delegate if you had another developer?', 'general'),
  ('Are there any security concerns or env var issues to address?', 'infrastructure'),
  ('What is the status of Wabbit RE property scraping?', 'wabbit-re'),
  ('Are there any API rate limits or costs you need to monitor?', 'infrastructure'),
  ('What cross-app integration would unlock the most value?', 'general')
ON CONFLICT DO NOTHING;

-- Migration: Create connection_health_cache table for GS Site Admin Dashboard
-- Run this in Supabase SQL Editor

-- =============================================================================
-- connection_health_cache table
-- Caches the health status of 3rd party service connections
-- =============================================================================

CREATE TABLE IF NOT EXISTS connection_health_cache (
  -- Service identifier as primary key (one row per service)
  service TEXT PRIMARY KEY,

  -- Connection status
  -- 'connected': Service is reachable and authenticated
  -- 'disconnected': Service is unreachable or auth failed
  -- 'checking': Currently verifying connection
  -- 'coming_soon': Integration not yet implemented
  -- 'not_configured': Missing credentials or configuration
  status TEXT NOT NULL CHECK (status IN (
    'connected',
    'disconnected',
    'checking',
    'coming_soon',
    'not_configured'
  )),

  -- Last time this service was checked
  last_checked TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Error message if status is 'disconnected'
  error_message TEXT,

  -- Additional metadata (response time, version, etc.)
  -- Example: { "responseTimeMs": 150, "apiVersion": "v1", "rateLimit": { "remaining": 95, "reset": "2024-12-24T00:00:00Z" } }
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_connection_health_status ON connection_health_cache(status);

-- Create index for stale cache detection
CREATE INDEX IF NOT EXISTS idx_connection_health_last_checked ON connection_health_cache(last_checked);

-- Enable Row Level Security
ALTER TABLE connection_health_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (anyone can check connection status)
CREATE POLICY "Anyone can read connection health" ON connection_health_cache
  FOR SELECT
  USING (true);

-- Create policy for write access (authenticated users / service role)
CREATE POLICY "Authenticated can update connection health" ON connection_health_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON connection_health_cache TO anon;
GRANT ALL ON connection_health_cache TO authenticated;
GRANT ALL ON connection_health_cache TO service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_connection_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_connection_health_timestamp ON connection_health_cache;
CREATE TRIGGER update_connection_health_timestamp
  BEFORE UPDATE ON connection_health_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_health_updated_at();

-- =============================================================================
-- Helper function to upsert connection health status
-- =============================================================================

CREATE OR REPLACE FUNCTION upsert_connection_health(
  p_service TEXT,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO connection_health_cache (service, status, error_message, metadata, last_checked)
  VALUES (p_service, p_status, p_error_message, p_metadata, NOW())
  ON CONFLICT (service) DO UPDATE SET
    status = EXCLUDED.status,
    error_message = EXCLUDED.error_message,
    metadata = EXCLUDED.metadata,
    last_checked = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Helper function to get stale connections (not checked in X minutes)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_stale_connections(p_minutes_threshold INTEGER DEFAULT 5)
RETURNS SETOF connection_health_cache AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM connection_health_cache
  WHERE last_checked < NOW() - (p_minutes_threshold || ' minutes')::INTERVAL
  ORDER BY last_checked ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Seed initial service entries
-- =============================================================================

INSERT INTO connection_health_cache (service, status, metadata) VALUES
  -- Implemented services
  ('notion', 'not_configured', '{"description": "Notion API for tiles, habits, tasks"}'),
  ('github', 'not_configured', '{"description": "GitHub API for repos, commits, search"}'),

  -- Coming soon services
  ('whoop', 'coming_soon', '{"description": "Whoop API for health tracking"}'),
  ('apple', 'coming_soon', '{"description": "Apple/iCloud for contacts, mail"}'),
  ('google', 'coming_soon', '{"description": "Google API for forms, calendar, gmail"}'),
  ('brother-printer', 'coming_soon', '{"description": "Brother printer integration"}'),
  ('youtube', 'coming_soon', '{"description": "YouTube API for video tracking"}'),
  ('scheduler', 'coming_soon', '{"description": "Social media scheduler (Buffer/Later)"}'),
  ('datadog', 'coming_soon', '{"description": "Datadog monitoring dashboard"}'),
  ('twilio', 'coming_soon', '{"description": "Twilio for SMS notifications"}'),

  -- Internal app connections
  ('wabbit', 'not_configured', '{"description": "Wabbit app integration"}'),
  ('wabbit-re', 'not_configured', '{"description": "Wabbit RE app integration"}'),
  ('gsrealty', 'not_configured', '{"description": "GSRealty client app integration"}'),

  -- Local/Logic services (always connected - frontend only)
  ('local-model', 'connected', '{"description": "Local LLM for time tracking", "alwaysConnected": true}'),
  ('logic', 'connected', '{"description": "Frontend-only logic tiles", "alwaysConnected": true}')
ON CONFLICT (service) DO NOTHING;

COMMENT ON TABLE connection_health_cache IS 'Cached health status of 3rd party service connections for GS Site';
COMMENT ON COLUMN connection_health_cache.service IS 'Unique service identifier';
COMMENT ON COLUMN connection_health_cache.status IS 'Current connection status';
COMMENT ON COLUMN connection_health_cache.last_checked IS 'Timestamp of last health check';
COMMENT ON COLUMN connection_health_cache.metadata IS 'Additional service-specific metadata';

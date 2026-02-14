-- Migration: 004_create_user_integrations
-- Description: Store OAuth tokens for 3rd party integrations (Gmail, Whoop, etc.)
-- Created: 2025-12-23

-- Create user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  service TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on user + service combination
  UNIQUE(user_id, service)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_service ON user_integrations(service);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_service ON user_integrations(user_id, service);

-- Enable Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own integrations
-- Note: In a real app, this would use auth.uid() instead of a text user_id
CREATE POLICY "Users can view own integrations"
  ON user_integrations
  FOR SELECT
  USING (true);  -- Adjust based on auth implementation

CREATE POLICY "Users can insert own integrations"
  ON user_integrations
  FOR INSERT
  WITH CHECK (true);  -- Adjust based on auth implementation

CREATE POLICY "Users can update own integrations"
  ON user_integrations
  FOR UPDATE
  USING (true);  -- Adjust based on auth implementation

CREATE POLICY "Users can delete own integrations"
  ON user_integrations
  FOR DELETE
  USING (true);  -- Adjust based on auth implementation

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integrations_updated_at();

-- Add comment to table
COMMENT ON TABLE user_integrations IS 'Stores OAuth tokens and credentials for 3rd party integrations (Gmail, Whoop, Apple, etc.)';
COMMENT ON COLUMN user_integrations.user_id IS 'User identifier (will be linked to auth.users in production)';
COMMENT ON COLUMN user_integrations.service IS 'Integration service name (gmail, whoop, apple, etc.)';
COMMENT ON COLUMN user_integrations.access_token IS 'OAuth access token (encrypted in production)';
COMMENT ON COLUMN user_integrations.refresh_token IS 'OAuth refresh token for token renewal';
COMMENT ON COLUMN user_integrations.expires_at IS 'When the access token expires';
COMMENT ON COLUMN user_integrations.email IS 'Associated email for the integration (if applicable)';
COMMENT ON COLUMN user_integrations.metadata IS 'Additional integration-specific metadata';

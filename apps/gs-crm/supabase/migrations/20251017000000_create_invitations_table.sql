-- ================================================================
-- GSRealty Phase 2: Email Invitations System
-- ================================================================
-- Purpose: Create invitations table for client account setup
-- Migration: 20251017000000_create_invitations_table
-- ================================================================

-- ================================================================
-- TABLE: gsrealty_invitations
-- ================================================================
-- Purpose: Track email invitations sent to clients for account setup
CREATE TABLE public.gsrealty_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.gsrealty_users(id),
  custom_message TEXT
);

COMMENT ON TABLE public.gsrealty_invitations IS 'Email invitations for client account setup';
COMMENT ON COLUMN public.gsrealty_invitations.client_id IS 'Reference to the client being invited';
COMMENT ON COLUMN public.gsrealty_invitations.token IS 'Unique token for setup link (UUID)';
COMMENT ON COLUMN public.gsrealty_invitations.expires_at IS 'Token expiration timestamp (7 days default)';
COMMENT ON COLUMN public.gsrealty_invitations.used_at IS 'When the invitation was used (NULL if not used)';
COMMENT ON COLUMN public.gsrealty_invitations.custom_message IS 'Optional custom message from admin';

-- ================================================================
-- INDEXES for Performance
-- ================================================================
CREATE INDEX idx_gsrealty_invitations_client_id ON public.gsrealty_invitations(client_id);
CREATE INDEX idx_gsrealty_invitations_token ON public.gsrealty_invitations(token);
CREATE INDEX idx_gsrealty_invitations_email ON public.gsrealty_invitations(email);
CREATE INDEX idx_gsrealty_invitations_expires_at ON public.gsrealty_invitations(expires_at);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE public.gsrealty_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
  ON public.gsrealty_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE gsrealty_users.auth_user_id = auth.uid()
      AND gsrealty_users.role = 'admin'
    )
  );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON public.gsrealty_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE gsrealty_users.auth_user_id = auth.uid()
      AND gsrealty_users.role = 'admin'
    )
  );

-- Admins can update invitations (for resend)
CREATE POLICY "Admins can update invitations"
  ON public.gsrealty_invitations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE gsrealty_users.auth_user_id = auth.uid()
      AND gsrealty_users.role = 'admin'
    )
  );

-- Allow public access to verify tokens (for setup page)
-- This is needed because setup page is accessed before authentication
CREATE POLICY "Public can verify invitation tokens"
  ON public.gsrealty_invitations
  FOR SELECT
  TO anon
  USING (
    expires_at > NOW()
    AND used_at IS NULL
  );

-- ================================================================
-- FUNCTION: Cleanup expired invitations
-- ================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete invitations that are expired and older than 30 days
  DELETE FROM public.gsrealty_invitations
  WHERE expires_at < (NOW() - INTERVAL '30 days')
  RETURNING COUNT(*) INTO deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_invitations() IS 'Delete expired invitations older than 30 days';

-- ================================================================
-- FUNCTION: Mark invitation as used
-- ================================================================
CREATE OR REPLACE FUNCTION mark_invitation_used(invitation_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.gsrealty_invitations
  SET used_at = NOW()
  WHERE token = invitation_token
  AND used_at IS NULL
  AND expires_at > NOW();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_invitation_used(TEXT) IS 'Mark an invitation as used by token';

-- Create event entries table for admin-created events visible to clients
CREATE TABLE IF NOT EXISTS gsrealty_event_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  body TEXT,
  client_id UUID REFERENCES gsrealty_clients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_event_entries_client_id ON gsrealty_event_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_event_entries_created_by ON gsrealty_event_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_event_entries_created_at ON gsrealty_event_entries(created_at DESC);

-- Enable RLS
ALTER TABLE gsrealty_event_entries ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage all event entries"
  ON gsrealty_event_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Clients can view events (global events or their own client-specific events)
CREATE POLICY "Clients can view relevant events"
  ON gsrealty_event_entries
  FOR SELECT
  USING (
    -- Global events (no client_id) are visible to all authenticated users
    client_id IS NULL
    OR
    -- Client-specific events are visible to that client
    EXISTS (
      SELECT 1 FROM gsrealty_clients
      WHERE gsrealty_clients.id = gsrealty_event_entries.client_id
      AND gsrealty_clients.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_gsrealty_event_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gsrealty_event_entries_updated_at
  BEFORE UPDATE ON gsrealty_event_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_gsrealty_event_entries_updated_at();

-- Add comment
COMMENT ON TABLE gsrealty_event_entries IS 'Event entries created by admin, viewable by clients';

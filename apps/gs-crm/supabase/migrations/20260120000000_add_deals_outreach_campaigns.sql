-- ================================================================
-- GSRealty KPIs Foundation: Deals, Outreach, Campaigns
-- ================================================================
-- Purpose: Create missing tables required for KPIs/Analytics
-- Migration: 20260120000000_add_deals_outreach_campaigns
-- ================================================================

-- ================================================================
-- TABLE 1: gsrealty_deals
-- ================================================================
-- Purpose: Track buyer/seller deals through pipeline stages
-- Used by: Pipeline page, Analytics, KPIs, Revenue calculations
CREATE TABLE IF NOT EXISTS public.gsrealty_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buyer', 'seller')),
  stage TEXT NOT NULL DEFAULT 'on_radar' CHECK (stage IN (
    'on_radar',
    'official_representation',
    'touring',
    'offers_in',
    'under_contract',
    'closed',
    'lost'
  )),
  property_address TEXT,
  deal_value NUMERIC(12, 2) DEFAULT 0,
  commission_rate NUMERIC(5, 4) DEFAULT 0.0300,
  expected_commission NUMERIC(12, 2) GENERATED ALWAYS AS (deal_value * commission_rate) STORED,
  representation_end_date DATE,
  closed_at TIMESTAMPTZ,
  won BOOLEAN,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.gsrealty_deals IS 'Real estate deals/transactions through pipeline';
COMMENT ON COLUMN public.gsrealty_deals.type IS 'Deal type: buyer or seller representation';
COMMENT ON COLUMN public.gsrealty_deals.stage IS 'Current pipeline stage';
COMMENT ON COLUMN public.gsrealty_deals.deal_value IS 'Total property value';
COMMENT ON COLUMN public.gsrealty_deals.commission_rate IS 'Commission percentage (e.g., 0.03 = 3%)';
COMMENT ON COLUMN public.gsrealty_deals.expected_commission IS 'Auto-calculated: deal_value * commission_rate';
COMMENT ON COLUMN public.gsrealty_deals.closed_at IS 'Date deal was closed (won or lost)';
COMMENT ON COLUMN public.gsrealty_deals.won IS 'True if closed-won, False if closed-lost, NULL if still active';
COMMENT ON COLUMN public.gsrealty_deals.position IS 'Order position within stage for kanban view';

-- Indexes for deals
CREATE INDEX IF NOT EXISTS idx_gsrealty_deals_client_id ON public.gsrealty_deals(client_id);
CREATE INDEX IF NOT EXISTS idx_gsrealty_deals_stage ON public.gsrealty_deals(stage);
CREATE INDEX IF NOT EXISTS idx_gsrealty_deals_created_at ON public.gsrealty_deals(created_at);
CREATE INDEX IF NOT EXISTS idx_gsrealty_deals_closed_at ON public.gsrealty_deals(closed_at);

-- Trigger for updated_at
CREATE TRIGGER update_gsrealty_deals_updated_at
  BEFORE UPDATE ON public.gsrealty_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE 2: gsrealty_outreach
-- ================================================================
-- Purpose: Track sales activities (calls, emails, meetings, texts)
-- Used by: Activity feed, Sales targets, KPIs
CREATE TABLE IF NOT EXISTS public.gsrealty_outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.gsrealty_deals(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'text', 'other')),
  notes TEXT,
  outcome TEXT,
  duration_minutes INTEGER,
  created_by UUID REFERENCES public.gsrealty_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.gsrealty_outreach IS 'Sales outreach activity log';
COMMENT ON COLUMN public.gsrealty_outreach.type IS 'Activity type: call, email, meeting, text, other';
COMMENT ON COLUMN public.gsrealty_outreach.outcome IS 'Result of the outreach (e.g., left voicemail, scheduled meeting)';
COMMENT ON COLUMN public.gsrealty_outreach.duration_minutes IS 'Duration for calls/meetings';
COMMENT ON COLUMN public.gsrealty_outreach.deal_id IS 'Optional link to specific deal';

-- Indexes for outreach
CREATE INDEX IF NOT EXISTS idx_gsrealty_outreach_client_id ON public.gsrealty_outreach(client_id);
CREATE INDEX IF NOT EXISTS idx_gsrealty_outreach_deal_id ON public.gsrealty_outreach(deal_id);
CREATE INDEX IF NOT EXISTS idx_gsrealty_outreach_type ON public.gsrealty_outreach(type);
CREATE INDEX IF NOT EXISTS idx_gsrealty_outreach_created_at ON public.gsrealty_outreach(created_at);
CREATE INDEX IF NOT EXISTS idx_gsrealty_outreach_created_by ON public.gsrealty_outreach(created_by);

-- ================================================================
-- TABLE 3: gsrealty_campaigns
-- ================================================================
-- Purpose: Track marketing campaigns and spend for ROI analysis
-- Used by: Campaign Spend KPI page
CREATE TABLE IF NOT EXISTS public.gsrealty_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'direct_mail',
    'digital_ads',
    'social_media',
    'email_marketing',
    'events',
    'referral_program',
    'seo',
    'print_ads',
    'other'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  budget NUMERIC(10, 2) DEFAULT 0,
  spent NUMERIC(10, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  target_audience TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.gsrealty_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.gsrealty_campaigns IS 'Marketing campaigns for spend tracking and ROI';
COMMENT ON COLUMN public.gsrealty_campaigns.type IS 'Campaign channel/type';
COMMENT ON COLUMN public.gsrealty_campaigns.budget IS 'Planned budget amount';
COMMENT ON COLUMN public.gsrealty_campaigns.spent IS 'Actual amount spent';

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_gsrealty_campaigns_status ON public.gsrealty_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_gsrealty_campaigns_type ON public.gsrealty_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_gsrealty_campaigns_start_date ON public.gsrealty_campaigns(start_date);

-- Trigger for updated_at
CREATE TRIGGER update_gsrealty_campaigns_updated_at
  BEFORE UPDATE ON public.gsrealty_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE 4: gsrealty_campaign_leads
-- ================================================================
-- Purpose: Link leads/clients to campaigns for attribution
-- Used by: Campaign ROI calculations
CREATE TABLE IF NOT EXISTS public.gsrealty_campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.gsrealty_campaigns(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE CASCADE,
  attributed_at TIMESTAMPTZ DEFAULT NOW(),
  conversion_value NUMERIC(12, 2),
  notes TEXT,
  UNIQUE(campaign_id, client_id)
);

COMMENT ON TABLE public.gsrealty_campaign_leads IS 'Campaign to client attribution for ROI tracking';
COMMENT ON COLUMN public.gsrealty_campaign_leads.conversion_value IS 'Revenue attributed to this campaign lead';

-- Indexes for campaign_leads
CREATE INDEX IF NOT EXISTS idx_gsrealty_campaign_leads_campaign_id ON public.gsrealty_campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_gsrealty_campaign_leads_client_id ON public.gsrealty_campaign_leads(client_id);

-- ================================================================
-- ALTER TABLE: gsrealty_clients - Add missing columns
-- ================================================================
-- Add client_type column
ALTER TABLE public.gsrealty_clients
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'buyer'
  CHECK (client_type IN ('buyer', 'seller', 'both'));

-- Add status column
ALTER TABLE public.gsrealty_clients
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'prospect'
  CHECK (status IN ('active', 'inactive', 'prospect', 'closed'));

-- Add lead_source column for campaign attribution
ALTER TABLE public.gsrealty_clients
  ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Add campaign_id for direct campaign attribution
ALTER TABLE public.gsrealty_clients
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.gsrealty_campaigns(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.gsrealty_clients.client_type IS 'Client type: buyer, seller, or both';
COMMENT ON COLUMN public.gsrealty_clients.status IS 'Client status in pipeline';
COMMENT ON COLUMN public.gsrealty_clients.lead_source IS 'How the client was acquired (e.g., referral, zillow, direct mail)';
COMMENT ON COLUMN public.gsrealty_clients.campaign_id IS 'Marketing campaign that generated this lead';

-- Index for new columns
CREATE INDEX IF NOT EXISTS idx_gsrealty_clients_status ON public.gsrealty_clients(status);
CREATE INDEX IF NOT EXISTS idx_gsrealty_clients_client_type ON public.gsrealty_clients(client_type);
CREATE INDEX IF NOT EXISTS idx_gsrealty_clients_lead_source ON public.gsrealty_clients(lead_source);
CREATE INDEX IF NOT EXISTS idx_gsrealty_clients_campaign_id ON public.gsrealty_clients(campaign_id);

-- ================================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================================

-- Enable RLS on new tables
ALTER TABLE public.gsrealty_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsrealty_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsrealty_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsrealty_campaign_leads ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS: gsrealty_deals
-- ================================================================
-- Admins can do everything
CREATE POLICY "gsrealty_deals_admin_all" ON public.gsrealty_deals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Clients can view their own deals
CREATE POLICY "gsrealty_deals_client_select" ON public.gsrealty_deals
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM public.gsrealty_clients c
      JOIN public.gsrealty_users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- ================================================================
-- RLS: gsrealty_outreach
-- ================================================================
-- Admins can do everything
CREATE POLICY "gsrealty_outreach_admin_all" ON public.gsrealty_outreach
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view outreach they created
CREATE POLICY "gsrealty_outreach_creator_select" ON public.gsrealty_outreach
  FOR SELECT
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ================================================================
-- RLS: gsrealty_campaigns
-- ================================================================
-- Admins can do everything
CREATE POLICY "gsrealty_campaigns_admin_all" ON public.gsrealty_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================================
-- RLS: gsrealty_campaign_leads
-- ================================================================
-- Admins can do everything
CREATE POLICY "gsrealty_campaign_leads_admin_all" ON public.gsrealty_campaign_leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gsrealty_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================================
-- SEED DATA: Default campaign types for dropdown
-- ================================================================
-- No seed data - campaigns will be created by users

-- ================================================================
-- Migration Complete
-- ================================================================

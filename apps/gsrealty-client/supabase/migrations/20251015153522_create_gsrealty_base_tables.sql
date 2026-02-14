-- ================================================================
-- GSRealty Phase 1: Database Schema
-- ================================================================
-- Purpose: Create core tables for GSRealty client management system
-- Migration: 20251015153522_create_gsrealty_base_tables
-- ================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE 1: gsrealty_users
-- ================================================================
-- Purpose: Track GSRealty users (admins and clients)
-- Links to auth.users for authentication
CREATE TABLE public.gsrealty_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  UNIQUE(auth_user_id)
);

COMMENT ON TABLE public.gsrealty_users IS 'GSRealty user accounts with roles';
COMMENT ON COLUMN public.gsrealty_users.auth_user_id IS 'Link to Supabase auth.users';
COMMENT ON COLUMN public.gsrealty_users.role IS 'User role: admin or client';

-- ================================================================
-- TABLE 2: gsrealty_clients
-- ================================================================
-- Purpose: Store client information and contact details
CREATE TABLE public.gsrealty_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.gsrealty_users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  property_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.gsrealty_clients IS 'Client contact information and details';
COMMENT ON COLUMN public.gsrealty_clients.user_id IS 'Optional link to gsrealty_users if client has login';
COMMENT ON COLUMN public.gsrealty_clients.property_address IS 'Primary property address for client';

-- ================================================================
-- TABLE 3: gsrealty_properties
-- ================================================================
-- Purpose: Store property data from Maricopa County and other sources
CREATE TABLE public.gsrealty_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE CASCADE,
  apn TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'AZ',
  zip TEXT,
  property_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.gsrealty_properties IS 'Property records from Maricopa County';
COMMENT ON COLUMN public.gsrealty_properties.apn IS 'Assessor Parcel Number (APN)';
COMMENT ON COLUMN public.gsrealty_properties.property_data IS 'Flexible JSONB field for all property attributes';

-- ================================================================
-- TABLE 4: gsrealty_login_activity
-- ================================================================
-- Purpose: Track user login activity for security auditing
CREATE TABLE public.gsrealty_login_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.gsrealty_users(id) ON DELETE CASCADE,
  login_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

COMMENT ON TABLE public.gsrealty_login_activity IS 'Login activity audit log';

-- ================================================================
-- TABLE 5: gsrealty_uploaded_files
-- ================================================================
-- Purpose: Track uploaded files (CSV, XLSX, HTML, PDF) and processing status
CREATE TABLE public.gsrealty_uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('csv', 'xlsx', 'html', 'pdf')),
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.gsrealty_users(id),
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processing_status TEXT,
  processing_errors JSONB
);

COMMENT ON TABLE public.gsrealty_uploaded_files IS 'Uploaded files and their processing status';
COMMENT ON COLUMN public.gsrealty_uploaded_files.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN public.gsrealty_uploaded_files.processing_errors IS 'JSONB array of any processing errors';

-- ================================================================
-- TABLE 6: gsrealty_admin_settings
-- ================================================================
-- Purpose: Store application-wide settings and configuration
CREATE TABLE public.gsrealty_admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.gsrealty_users(id)
);

COMMENT ON TABLE public.gsrealty_admin_settings IS 'Application configuration settings';
COMMENT ON COLUMN public.gsrealty_admin_settings.setting_key IS 'Unique setting identifier';
COMMENT ON COLUMN public.gsrealty_admin_settings.setting_value IS 'JSONB value for flexible settings';

-- ================================================================
-- INDEXES for Performance
-- ================================================================
CREATE INDEX idx_gsrealty_clients_user_id ON public.gsrealty_clients(user_id);
CREATE INDEX idx_gsrealty_properties_client_id ON public.gsrealty_properties(client_id);
CREATE INDEX idx_gsrealty_properties_apn ON public.gsrealty_properties(apn);
CREATE INDEX idx_gsrealty_files_client_id ON public.gsrealty_uploaded_files(client_id);
CREATE INDEX idx_gsrealty_login_activity_user_id ON public.gsrealty_login_activity(user_id);

COMMENT ON INDEX idx_gsrealty_properties_apn IS 'Fast lookups by APN';

-- ================================================================
-- TRIGGER FUNCTION for updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically update updated_at timestamp';

-- ================================================================
-- TRIGGERS
-- ================================================================
CREATE TRIGGER update_gsrealty_clients_updated_at
  BEFORE UPDATE ON public.gsrealty_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gsrealty_properties_updated_at
  BEFORE UPDATE ON public.gsrealty_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


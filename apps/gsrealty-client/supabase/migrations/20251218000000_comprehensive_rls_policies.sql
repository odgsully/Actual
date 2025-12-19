-- ================================================================
-- Comprehensive RLS Policies Migration
-- ================================================================
-- Purpose: Add Row Level Security to all tables missing policies
-- Migration: 007_comprehensive_rls_policies
-- Created: December 18, 2025
-- ================================================================
--
-- CRITICAL: This migration addresses security gaps identified in
-- the monorepo migration audit. Execute in production with caution.
--
-- Tables covered:
-- - Wabbit: properties, property_images, property_locations
-- - Wabbit: user_properties (missing CRUD policies)
-- - Wabbit: third_party_connections (missing CRUD policies)
-- - Wabbit: activity_log (missing INSERT policy)
-- - GSRealty: All 6 tables (no RLS previously)
-- ================================================================

-- ================================================================
-- PART 1: WABBIT TABLES - PUBLIC DATA
-- ================================================================
-- Properties are public listings - anyone can view them

-- Enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties: Public read access (these are public listings)
CREATE POLICY "Anyone can view properties" ON public.properties
    FOR SELECT
    USING (true);

-- Properties: Only service role can insert/update/delete (scraping system)
CREATE POLICY "Service role can manage properties" ON public.properties
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================================
-- Property Images
-- ================================================================
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Property images: Public read access
CREATE POLICY "Anyone can view property images" ON public.property_images
    FOR SELECT
    USING (true);

-- Property images: Only service role can manage
CREATE POLICY "Service role can manage property images" ON public.property_images
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================================
-- Property Locations (OpenAI generated data)
-- ================================================================
ALTER TABLE public.property_locations ENABLE ROW LEVEL SECURITY;

-- Property locations: Public read access
CREATE POLICY "Anyone can view property locations" ON public.property_locations
    FOR SELECT
    USING (true);

-- Property locations: Only service role can manage
CREATE POLICY "Service role can manage property locations" ON public.property_locations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================================
-- PART 2: WABBIT TABLES - USER DATA (missing policies)
-- ================================================================

-- User Properties: Add missing INSERT/UPDATE/DELETE policies
-- (SELECT policy already exists)
CREATE POLICY "Users can add properties to their list" ON public.user_properties
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their property associations" ON public.user_properties
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove properties from their list" ON public.user_properties
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ================================================================
-- Third Party Connections
-- ================================================================
-- Users can only manage their own platform connections

CREATE POLICY "Users can add their own connections" ON public.third_party_connections
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON public.third_party_connections
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON public.third_party_connections
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ================================================================
-- Activity Log
-- ================================================================
-- Users can insert their own activity, only admins can read all

CREATE POLICY "Users can log their own activity" ON public.activity_log
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity" ON public.activity_log
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can read all activity (for admin dashboard)
CREATE POLICY "Service role can read all activity" ON public.activity_log
    FOR SELECT
    TO service_role
    USING (true);

-- ================================================================
-- PART 3: GSREALTY TABLES
-- ================================================================
-- GSRealty uses role-based access:
-- - 'admin' role: Full access to all data
-- - 'client' role: Access only to their own data

-- Helper function to check if current user is a GSRealty admin
CREATE OR REPLACE FUNCTION public.is_gsrealty_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.gsrealty_users
        WHERE auth_user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's gsrealty_users id
CREATE OR REPLACE FUNCTION public.get_gsrealty_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM public.gsrealty_users
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- GSRealty Users Table
-- ================================================================
ALTER TABLE public.gsrealty_users ENABLE ROW LEVEL SECURITY;

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.gsrealty_users
    FOR SELECT
    TO authenticated
    USING (public.is_gsrealty_admin() OR auth_user_id = auth.uid());

-- Admins can insert new users
CREATE POLICY "Admins can create users" ON public.gsrealty_users
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_gsrealty_admin());

-- Admins can update any user, users can update themselves
CREATE POLICY "Admins can update users" ON public.gsrealty_users
    FOR UPDATE
    TO authenticated
    USING (public.is_gsrealty_admin() OR auth_user_id = auth.uid())
    WITH CHECK (public.is_gsrealty_admin() OR auth_user_id = auth.uid());

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON public.gsrealty_users
    FOR DELETE
    TO authenticated
    USING (public.is_gsrealty_admin());

-- ================================================================
-- GSRealty Clients Table
-- ================================================================
ALTER TABLE public.gsrealty_clients ENABLE ROW LEVEL SECURITY;

-- Admins can view all clients, clients can view own record
CREATE POLICY "Access own client record or admin access" ON public.gsrealty_clients
    FOR SELECT
    TO authenticated
    USING (
        public.is_gsrealty_admin()
        OR user_id = public.get_gsrealty_user_id()
    );

-- Only admins can create clients
CREATE POLICY "Admins can create clients" ON public.gsrealty_clients
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_gsrealty_admin());

-- Admins can update any client
CREATE POLICY "Admins can update clients" ON public.gsrealty_clients
    FOR UPDATE
    TO authenticated
    USING (public.is_gsrealty_admin())
    WITH CHECK (public.is_gsrealty_admin());

-- Only admins can delete clients
CREATE POLICY "Admins can delete clients" ON public.gsrealty_clients
    FOR DELETE
    TO authenticated
    USING (public.is_gsrealty_admin());

-- ================================================================
-- GSRealty Properties Table
-- ================================================================
ALTER TABLE public.gsrealty_properties ENABLE ROW LEVEL SECURITY;

-- Admins see all, clients see properties linked to their client record
CREATE POLICY "Access properties based on role" ON public.gsrealty_properties
    FOR SELECT
    TO authenticated
    USING (
        public.is_gsrealty_admin()
        OR client_id IN (
            SELECT id FROM public.gsrealty_clients
            WHERE user_id = public.get_gsrealty_user_id()
        )
    );

-- Only admins can manage properties
CREATE POLICY "Admins can manage properties" ON public.gsrealty_properties
    FOR ALL
    TO authenticated
    USING (public.is_gsrealty_admin())
    WITH CHECK (public.is_gsrealty_admin());

-- ================================================================
-- GSRealty Login Activity Table
-- ================================================================
ALTER TABLE public.gsrealty_login_activity ENABLE ROW LEVEL SECURITY;

-- Admins can view all login activity
CREATE POLICY "Admins can view all login activity" ON public.gsrealty_login_activity
    FOR SELECT
    TO authenticated
    USING (public.is_gsrealty_admin());

-- Users can view their own login activity
CREATE POLICY "Users can view own login activity" ON public.gsrealty_login_activity
    FOR SELECT
    TO authenticated
    USING (user_id = public.get_gsrealty_user_id());

-- Anyone authenticated can insert their login (triggered on login)
CREATE POLICY "Users can log their own logins" ON public.gsrealty_login_activity
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = public.get_gsrealty_user_id());

-- ================================================================
-- GSRealty Uploaded Files Table
-- ================================================================
ALTER TABLE public.gsrealty_uploaded_files ENABLE ROW LEVEL SECURITY;

-- Admins see all files, clients see files for their client record
CREATE POLICY "Access files based on role" ON public.gsrealty_uploaded_files
    FOR SELECT
    TO authenticated
    USING (
        public.is_gsrealty_admin()
        OR client_id IN (
            SELECT id FROM public.gsrealty_clients
            WHERE user_id = public.get_gsrealty_user_id()
        )
    );

-- Only admins can manage files
CREATE POLICY "Admins can manage files" ON public.gsrealty_uploaded_files
    FOR ALL
    TO authenticated
    USING (public.is_gsrealty_admin())
    WITH CHECK (public.is_gsrealty_admin());

-- ================================================================
-- GSRealty Admin Settings Table
-- ================================================================
ALTER TABLE public.gsrealty_admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access admin settings
CREATE POLICY "Only admins can view settings" ON public.gsrealty_admin_settings
    FOR SELECT
    TO authenticated
    USING (public.is_gsrealty_admin());

CREATE POLICY "Only admins can manage settings" ON public.gsrealty_admin_settings
    FOR ALL
    TO authenticated
    USING (public.is_gsrealty_admin())
    WITH CHECK (public.is_gsrealty_admin());

-- ================================================================
-- PART 4: FIX USER_PROFILES INSERT POLICY
-- ================================================================
-- Ensure users can create their own profile during signup

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Add INSERT policy for user_profiles
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ================================================================
-- VERIFICATION QUERIES (run manually to verify)
-- ================================================================
--
-- Check RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN (
--   'properties', 'property_images', 'property_locations',
--   'user_profiles', 'user_properties', 'rankings',
--   'third_party_connections', 'activity_log',
--   'gsrealty_users', 'gsrealty_clients', 'gsrealty_properties',
--   'gsrealty_login_activity', 'gsrealty_uploaded_files', 'gsrealty_admin_settings'
-- );
--
-- List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public';
-- ================================================================

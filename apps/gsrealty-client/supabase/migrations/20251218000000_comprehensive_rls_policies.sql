-- ================================================================
-- Comprehensive RLS Policies Migration (Idempotent)
-- ================================================================
-- Purpose: Add Row Level Security to all tables missing policies
-- Migration: 007_comprehensive_rls_policies
-- Created: December 18, 2025
-- ================================================================
-- This migration is IDEMPOTENT - safe to run multiple times
-- Uses DROP POLICY IF EXISTS before CREATE POLICY
-- ================================================================

-- ================================================================
-- PART 1: WABBIT TABLES - PUBLIC DATA
-- ================================================================

-- Enable RLS on properties table
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;

-- Properties policies
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
CREATE POLICY "Anyone can view properties" ON public.properties
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage properties" ON public.properties;
CREATE POLICY "Service role can manage properties" ON public.properties
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ================================================================
-- Property Images
-- ================================================================
ALTER TABLE IF EXISTS public.property_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view property images" ON public.property_images;
CREATE POLICY "Anyone can view property images" ON public.property_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage property images" ON public.property_images;
CREATE POLICY "Service role can manage property images" ON public.property_images
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ================================================================
-- Property Locations
-- ================================================================
ALTER TABLE IF EXISTS public.property_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view property locations" ON public.property_locations;
CREATE POLICY "Anyone can view property locations" ON public.property_locations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage property locations" ON public.property_locations;
CREATE POLICY "Service role can manage property locations" ON public.property_locations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ================================================================
-- PART 2: WABBIT TABLES - USER DATA
-- ================================================================

-- User Properties
DROP POLICY IF EXISTS "Users can add properties to their list" ON public.user_properties;
CREATE POLICY "Users can add properties to their list" ON public.user_properties
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their property associations" ON public.user_properties;
CREATE POLICY "Users can update their property associations" ON public.user_properties
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove properties from their list" ON public.user_properties;
CREATE POLICY "Users can remove properties from their list" ON public.user_properties
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ================================================================
-- Third Party Connections
-- ================================================================
DROP POLICY IF EXISTS "Users can add their own connections" ON public.third_party_connections;
CREATE POLICY "Users can add their own connections" ON public.third_party_connections
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own connections" ON public.third_party_connections;
CREATE POLICY "Users can update their own connections" ON public.third_party_connections
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own connections" ON public.third_party_connections;
CREATE POLICY "Users can delete their own connections" ON public.third_party_connections
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ================================================================
-- Activity Log
-- ================================================================
DROP POLICY IF EXISTS "Users can log their own activity" ON public.activity_log;
CREATE POLICY "Users can log their own activity" ON public.activity_log
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own activity" ON public.activity_log;
CREATE POLICY "Users can view their own activity" ON public.activity_log
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can read all activity" ON public.activity_log;
CREATE POLICY "Service role can read all activity" ON public.activity_log
    FOR SELECT TO service_role USING (true);

-- ================================================================
-- PART 3: GSREALTY TABLES
-- ================================================================

-- Helper function to check if current user is a GSRealty admin
CREATE OR REPLACE FUNCTION public.is_gsrealty_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.gsrealty_users
        WHERE auth_user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's gsrealty_users id
CREATE OR REPLACE FUNCTION public.get_gsrealty_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.gsrealty_users WHERE auth_user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- GSRealty Users Table
-- ================================================================
ALTER TABLE IF EXISTS public.gsrealty_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all users" ON public.gsrealty_users;
CREATE POLICY "Admins can view all users" ON public.gsrealty_users
    FOR SELECT TO authenticated USING (public.is_gsrealty_admin() OR auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can create users" ON public.gsrealty_users;
CREATE POLICY "Admins can create users" ON public.gsrealty_users
    FOR INSERT TO authenticated WITH CHECK (public.is_gsrealty_admin());

DROP POLICY IF EXISTS "Admins can update users" ON public.gsrealty_users;
CREATE POLICY "Admins can update users" ON public.gsrealty_users
    FOR UPDATE TO authenticated
    USING (public.is_gsrealty_admin() OR auth_user_id = auth.uid())
    WITH CHECK (public.is_gsrealty_admin() OR auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete users" ON public.gsrealty_users;
CREATE POLICY "Admins can delete users" ON public.gsrealty_users
    FOR DELETE TO authenticated USING (public.is_gsrealty_admin());

-- ================================================================
-- GSRealty Clients Table
-- ================================================================
ALTER TABLE IF EXISTS public.gsrealty_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Access own client record or admin access" ON public.gsrealty_clients;
CREATE POLICY "Access own client record or admin access" ON public.gsrealty_clients
    FOR SELECT TO authenticated
    USING (public.is_gsrealty_admin() OR user_id = public.get_gsrealty_user_id());

DROP POLICY IF EXISTS "Admins can create clients" ON public.gsrealty_clients;
CREATE POLICY "Admins can create clients" ON public.gsrealty_clients
    FOR INSERT TO authenticated WITH CHECK (public.is_gsrealty_admin());

DROP POLICY IF EXISTS "Admins can update clients" ON public.gsrealty_clients;
CREATE POLICY "Admins can update clients" ON public.gsrealty_clients
    FOR UPDATE TO authenticated USING (public.is_gsrealty_admin()) WITH CHECK (public.is_gsrealty_admin());

DROP POLICY IF EXISTS "Admins can delete clients" ON public.gsrealty_clients;
CREATE POLICY "Admins can delete clients" ON public.gsrealty_clients
    FOR DELETE TO authenticated USING (public.is_gsrealty_admin());

-- ================================================================
-- GSRealty Properties Table
-- ================================================================
ALTER TABLE IF EXISTS public.gsrealty_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Access properties based on role" ON public.gsrealty_properties;
CREATE POLICY "Access properties based on role" ON public.gsrealty_properties
    FOR SELECT TO authenticated
    USING (public.is_gsrealty_admin() OR client_id IN (
        SELECT id FROM public.gsrealty_clients WHERE user_id = public.get_gsrealty_user_id()
    ));

DROP POLICY IF EXISTS "Admins can manage properties" ON public.gsrealty_properties;
CREATE POLICY "Admins can manage properties" ON public.gsrealty_properties
    FOR ALL TO authenticated USING (public.is_gsrealty_admin()) WITH CHECK (public.is_gsrealty_admin());

-- ================================================================
-- GSRealty Login Activity Table
-- ================================================================
ALTER TABLE IF EXISTS public.gsrealty_login_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all login activity" ON public.gsrealty_login_activity;
CREATE POLICY "Admins can view all login activity" ON public.gsrealty_login_activity
    FOR SELECT TO authenticated USING (public.is_gsrealty_admin());

DROP POLICY IF EXISTS "Users can view own login activity" ON public.gsrealty_login_activity;
CREATE POLICY "Users can view own login activity" ON public.gsrealty_login_activity
    FOR SELECT TO authenticated USING (user_id = public.get_gsrealty_user_id());

DROP POLICY IF EXISTS "Users can log their own logins" ON public.gsrealty_login_activity;
CREATE POLICY "Users can log their own logins" ON public.gsrealty_login_activity
    FOR INSERT TO authenticated WITH CHECK (user_id = public.get_gsrealty_user_id());

-- ================================================================
-- GSRealty Uploaded Files Table
-- ================================================================
ALTER TABLE IF EXISTS public.gsrealty_uploaded_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Access files based on role" ON public.gsrealty_uploaded_files;
CREATE POLICY "Access files based on role" ON public.gsrealty_uploaded_files
    FOR SELECT TO authenticated
    USING (public.is_gsrealty_admin() OR client_id IN (
        SELECT id FROM public.gsrealty_clients WHERE user_id = public.get_gsrealty_user_id()
    ));

DROP POLICY IF EXISTS "Admins can manage files" ON public.gsrealty_uploaded_files;
CREATE POLICY "Admins can manage files" ON public.gsrealty_uploaded_files
    FOR ALL TO authenticated USING (public.is_gsrealty_admin()) WITH CHECK (public.is_gsrealty_admin());

-- ================================================================
-- GSRealty Admin Settings Table
-- ================================================================
ALTER TABLE IF EXISTS public.gsrealty_admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view settings" ON public.gsrealty_admin_settings;
CREATE POLICY "Only admins can view settings" ON public.gsrealty_admin_settings
    FOR SELECT TO authenticated USING (public.is_gsrealty_admin());

DROP POLICY IF EXISTS "Only admins can manage settings" ON public.gsrealty_admin_settings;
CREATE POLICY "Only admins can manage settings" ON public.gsrealty_admin_settings
    FOR ALL TO authenticated USING (public.is_gsrealty_admin()) WITH CHECK (public.is_gsrealty_admin());

-- ================================================================
-- PART 4: FIX USER_PROFILES INSERT POLICY
-- ================================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

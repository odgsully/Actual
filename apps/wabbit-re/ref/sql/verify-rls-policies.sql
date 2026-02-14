-- ================================================================
-- RLS Policy Verification Script
-- ================================================================
-- Run this script to verify all RLS policies are correctly applied
-- Execute in Supabase SQL Editor or via psql
-- ================================================================

-- 1. Check RLS is enabled on all critical tables
SELECT
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    -- Wabbit tables
    'properties', 'property_images', 'property_locations',
    'user_profiles', 'buyer_preferences', 'user_properties',
    'rankings', 'shared_accounts',
    'third_party_connections', 'activity_log',
    -- GSRealty tables
    'gsrealty_users', 'gsrealty_clients', 'gsrealty_properties',
    'gsrealty_login_activity', 'gsrealty_uploaded_files', 'gsrealty_admin_settings'
)
ORDER BY tablename;

-- 2. List all policies by table
SELECT
    tablename,
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation,
    roles::text,
    CASE WHEN permissive = 'PERMISSIVE' THEN 'Allow' ELSE 'Deny' END as type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 3. Count policies per table (should have at least 1 for each operation needed)
SELECT
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(DISTINCT cmd, ', ' ORDER BY cmd) as operations_covered
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Identify tables with RLS enabled but NO policies (security risk!)
SELECT
    t.tablename,
    '⚠️ RLS enabled but NO policies!' as warning
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND p.policyname IS NULL;

-- 5. Test helper functions exist
SELECT
    proname as function_name,
    CASE WHEN proname IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM pg_proc
WHERE proname IN ('is_gsrealty_admin', 'get_gsrealty_user_id')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- Expected Results Summary:
-- ================================================================
-- All tables should show "✅ Enabled" for RLS
-- Each table should have appropriate policies for SELECT/INSERT/UPDATE/DELETE
-- No tables should appear in the "NO policies" warning query
-- Both helper functions should show "✅ Exists"
-- ================================================================

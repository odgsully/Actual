-- ================================================================
-- GSRealty Safety Check: Document Current Database State
-- ================================================================
-- Purpose: Snapshot current Supabase database BEFORE creating gsrealty tables
-- Run this in: Supabase Dashboard → SQL Editor
-- Save output to: apps/gsrealty-client/safety-docs/database-state-snapshot.txt
-- ================================================================

-- ====================
-- 1. LIST ALL TABLES
-- ====================
SELECT
    schemaname,
    tablename,
    'table' as object_type
FROM pg_tables
WHERE schemaname IN ('public', 'auth', 'storage')
ORDER BY schemaname, tablename;

-- ====================
-- 2. CHECK FOR NAME COLLISIONS
-- ====================
-- This should return 0 rows!
-- If ANY rows returned, STOP and choose different table names!

SELECT
    tablename,
    '❌ COLLISION!' as warning
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'gsrealty_users',
    'gsrealty_clients',
    'gsrealty_properties',
    'gsrealty_login_activity',
    'gsrealty_uploaded_files',
    'gsrealty_admin_settings'
);

-- Expected output: 0 rows
-- If you see any rows, these table names already exist!

-- ====================
-- 3. LIST ALL STORAGE BUCKETS
-- ====================
SELECT
    id,
    name,
    public,
    created_at
FROM storage.buckets
ORDER BY created_at;

-- ====================
-- 4. CHECK FOR BUCKET COLLISION
-- ====================
-- This should return 0 rows!

SELECT
    id,
    name,
    '❌ BUCKET EXISTS!' as warning
FROM storage.buckets
WHERE id = 'gsrealty-documents'
   OR name = 'gsrealty-documents';

-- Expected output: 0 rows

-- ====================
-- 5. LIST ALL RLS POLICIES
-- ====================
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ====================
-- 6. LIST ALL FUNCTIONS
-- ====================
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth', 'storage')
ORDER BY schema, function_name;

-- ====================
-- 7. COUNT ROWS IN EXISTING TABLES (Sample)
-- ====================
-- Adjust table names based on what you find in step 1

-- Example for wabbit-re tables (adjust as needed):
SELECT 'properties' as table_name, COUNT(*) as row_count
FROM properties
WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'properties')

UNION ALL

SELECT 'users', COUNT(*)
FROM auth.users

UNION ALL

SELECT 'user_properties', COUNT(*)
FROM user_properties
WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_properties');

-- ====================
-- 8. LIST ALL INDEXES
-- ====================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ====================
-- 9. LIST ALL FOREIGN KEYS
-- ====================
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ====================
-- 10. STORAGE POLICIES
-- ====================
-- Note: Storage policies are in storage.objects table

SELECT
    name,
    definition
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY name;

-- ================================================================
-- VERIFICATION CHECKLIST
-- ================================================================
--
-- After running this script, verify:
--
-- ✅ No tables with 'gsrealty_' prefix exist
-- ✅ No bucket named 'gsrealty-documents' exists
-- ✅ No function named 'is_admin' exists (we'll create this)
-- ✅ Document total number of tables in 'public' schema
-- ✅ Document total number of storage buckets
-- ✅ Save all output to safety-docs/database-state-snapshot.txt
--
-- ================================================================

-- FINAL SUMMARY QUERY
-- ====================
SELECT
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
    (SELECT COUNT(*) FROM storage.buckets) as total_buckets,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    NOW() as snapshot_time;

-- ================================================================
-- SAVE THIS OUTPUT
-- ================================================================
-- Copy all results and save to:
-- apps/gsrealty-client/safety-docs/database-state-snapshot.txt
--
-- This creates a baseline to compare against after Phase 1
-- ================================================================

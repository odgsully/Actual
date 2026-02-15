-- ================================================================
-- GSRealty Storage RLS Policies
-- Migration: 003
-- Created: October 16, 2025
-- Purpose: Secure file access with row-level security
-- ================================================================

-- Note: storage.objects already has RLS enabled by Supabase
-- We don't need to ALTER it (requires superuser permissions)

-- Enable RLS on gsrealty_uploaded_files (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = 'gsrealty_uploaded_files') THEN
    ALTER TABLE gsrealty_uploaded_files ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ================================================================
-- Storage Bucket Policies
-- ================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Clients can read own files" ON storage.objects;
DROP POLICY IF EXISTS "No public access" ON storage.objects;

-- Policy 1: Admin full access
-- Allows admins to perform ALL operations (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin full access to uploads"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'gsrealty-uploads'
  AND EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

-- Policy 2: Client read own files
-- Allows clients to SELECT (read/download) only their own files
CREATE POLICY "Clients can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gsrealty-uploads'
  AND (storage.foldername(name))[1] = 'clients'
  AND (storage.foldername(name))[2] = (
    SELECT id::text FROM gsrealty_clients
    WHERE user_id = (
      SELECT id FROM gsrealty_users
      WHERE auth_user_id = auth.uid()
      AND role = 'client'
    )
  )
);

-- Policy 3: No public access
-- Prevents anonymous users from accessing any files
CREATE POLICY "No public access"
ON storage.objects FOR SELECT
TO anon
USING (false);

-- ================================================================
-- Database Table Policies (gsrealty_uploaded_files)
-- ================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin view all files" ON gsrealty_uploaded_files;
DROP POLICY IF EXISTS "Admin insert files" ON gsrealty_uploaded_files;
DROP POLICY IF EXISTS "Admin update files" ON gsrealty_uploaded_files;
DROP POLICY IF EXISTS "Admin delete files" ON gsrealty_uploaded_files;
DROP POLICY IF EXISTS "Clients view own files" ON gsrealty_uploaded_files;

-- Admin policies
CREATE POLICY "Admin view all files"
ON gsrealty_uploaded_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

CREATE POLICY "Admin insert files"
ON gsrealty_uploaded_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

CREATE POLICY "Admin update files"
ON gsrealty_uploaded_files FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

CREATE POLICY "Admin delete files"
ON gsrealty_uploaded_files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

-- Client policy
CREATE POLICY "Clients view own files"
ON gsrealty_uploaded_files FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM gsrealty_clients
    WHERE user_id = (
      SELECT id FROM gsrealty_users
      WHERE auth_user_id = auth.uid()
      AND role = 'client'
    )
  )
);

-- ================================================================
-- Verification Queries
-- ================================================================

-- Verify storage policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- Verify database policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'gsrealty_uploaded_files'
ORDER BY policyname;

-- ================================================================
-- Expected Output:
-- ================================================================
-- storage.objects policies:
--   1. Admin full access to uploads (ALL)
--   2. Clients can read own files (SELECT)
--   3. No public access (SELECT - false)
--
-- gsrealty_uploaded_files policies:
--   1. Admin view all files (SELECT)
--   2. Admin insert files (INSERT)
--   3. Admin update files (UPDATE)
--   4. Admin delete files (DELETE)
--   5. Clients view own files (SELECT)
-- ================================================================

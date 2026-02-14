-- Complete User Deletion Script for Supabase
-- This removes a user from ALL tables
-- Replace 'user@example.com' with the actual email to delete

-- IMPORTANT: This script has 2 parts:
-- Part 1: Can be run in SQL Editor (your data tables)
-- Part 2: Must be done via Dashboard or Admin API (auth.users)

-- ============================================
-- PART 1: Delete from YOUR tables (run this in SQL Editor)
-- ============================================

-- Set the email of the user to delete
DO $$
DECLARE
    user_email TEXT := 'user@example.com';  -- CHANGE THIS!
    user_uuid UUID;
BEGIN
    -- Get the user's ID from user_profiles
    SELECT id INTO user_uuid 
    FROM public.user_profiles 
    WHERE email = user_email;
    
    IF user_uuid IS NOT NULL THEN
        -- Delete from buyer_preferences first (foreign key constraint)
        DELETE FROM public.buyer_preferences 
        WHERE user_id = user_uuid;
        RAISE NOTICE 'Deleted from buyer_preferences for user %', user_email;
        
        -- Delete from rankings if exists
        DELETE FROM public.rankings 
        WHERE user_id = user_uuid;
        RAISE NOTICE 'Deleted from rankings for user %', user_email;
        
        -- Delete from user_properties if exists
        DELETE FROM public.user_properties 
        WHERE user_id = user_uuid;
        RAISE NOTICE 'Deleted from user_properties for user %', user_email;
        
        -- Delete from shared_accounts if exists
        DELETE FROM public.shared_accounts 
        WHERE primary_user_id = user_uuid OR secondary_user_id = user_uuid;
        RAISE NOTICE 'Deleted from shared_accounts for user %', user_email;
        
        -- Delete from activity_log if exists
        DELETE FROM public.activity_log 
        WHERE user_id = user_uuid;
        RAISE NOTICE 'Deleted from activity_log for user %', user_email;
        
        -- Finally delete from user_profiles
        DELETE FROM public.user_profiles 
        WHERE id = user_uuid;
        RAISE NOTICE 'Deleted from user_profiles for user %', user_email;
        
        RAISE NOTICE 'Successfully deleted all data for user %', user_email;
    ELSE
        RAISE NOTICE 'User % not found in user_profiles', user_email;
    END IF;
END $$;

-- ============================================
-- PART 2: Delete from auth.users (MANUAL STEPS)
-- ============================================

-- You CANNOT directly delete from auth.users via SQL Editor
-- Use ONE of these methods:

-- METHOD 1: Supabase Dashboard (Easiest)
-- 1. Go to Authentication > Users
-- 2. Find the user by email
-- 3. Click the three dots menu
-- 4. Select "Delete user"

-- METHOD 2: Using SQL (requires special permissions)
-- This usually won't work in the SQL Editor but documenting for completeness:
/*
DELETE FROM auth.users 
WHERE email = 'user@example.com';
*/

-- METHOD 3: Check what data exists for a user
-- Run this to see all tables where user exists:
/*
SELECT 'auth.users' as table_name, COUNT(*) as count 
FROM auth.users 
WHERE email = 'user@example.com'
UNION ALL
SELECT 'user_profiles', COUNT(*) 
FROM public.user_profiles 
WHERE email = 'user@example.com'
UNION ALL
SELECT 'buyer_preferences', COUNT(*) 
FROM public.buyer_preferences 
WHERE user_id = (SELECT id FROM public.user_profiles WHERE email = 'user@example.com');
*/
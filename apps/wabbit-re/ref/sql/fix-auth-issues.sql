-- Fix RLS policies for user_profiles table
-- Allow users to insert their own profile during signup

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create new policies that allow profile creation during signup
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create test user accounts if they don't exist
-- Note: Run these in Supabase dashboard Auth section or via API
-- Test User 1: test1@example.com / password123
-- Test User 2: test2@example.com / password123
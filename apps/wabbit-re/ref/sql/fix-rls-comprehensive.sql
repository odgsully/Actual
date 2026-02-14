-- Comprehensive RLS Fix for user_profiles table
-- This fixes the signup flow by allowing authenticated users to create their profile

-- First, check current policies (optional - for debugging)
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- OPTION 1: More permissive during signup (RECOMMENDED)
-- This allows any authenticated user to insert a profile with their own ID
CREATE POLICY "Enable insert for authenticated users only" ON public.user_profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users based on user_id" ON public.user_profiles
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON public.user_profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on user_id" ON public.user_profiles
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = id);

-- Alternative OPTION 2: If above doesn't work, temporarily disable RLS (NOT for production!)
-- WARNING: Only use this for testing, then re-enable with proper policies
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- To re-enable later:
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
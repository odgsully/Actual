# Step-by-Step Guide to Fix Authentication in Supabase

## What's the Problem?
When new users try to sign up, they get an error because the database security rules (RLS policies) don't allow new users to create their profile. We need to add permission for users to INSERT their own profile.

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Click "Sign In" (top right)
3. Sign in with your account
4. You'll see your projects - click on your project (it should have the URL: `fsaluvvszosucvzaedtj.supabase.co`)

### Step 2: Navigate to SQL Editor
1. Once in your project, look at the left sidebar
2. Find and click on "SQL Editor" (it has a database/code icon)
3. You'll see a page with a text area where you can write SQL

### Step 3: Copy the Fix SQL
Copy this entire SQL code:
```sql
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
```

### Step 4: Run the SQL
1. Paste the SQL code into the SQL Editor text area
2. Click the "Run" button (usually green, at the bottom right of the editor)
3. You should see a success message like "Success. No rows returned"
4. If you see any errors, let me know what they say

### Step 5: Create Test Users (Optional but Recommended)
1. In the left sidebar, click on "Authentication"
2. Click on the "Users" tab
3. Click "Add user" button (top right)
4. Create a test user:
   - Email: `test1@example.com`
   - Password: `testpass123`
   - Click "Create user"
5. Repeat for a second test user if needed:
   - Email: `test2@example.com`
   - Password: `testpass123`

### Step 6: Test the Fix
1. Go back to your app at http://localhost:3000
2. Click "Sign Up"
3. Try creating a new account with a different email
4. Fill in all the required fields
5. Click "Create Account"
6. It should work now without the RLS policy error!

## What Did We Just Do?

**In Simple Terms:**
- Supabase has security rules called "Row Level Security" (RLS) that control who can read/write data
- The original rules only allowed users to VIEW and UPDATE their profiles
- We added a rule to allow users to INSERT (create) their profile when they sign up
- Now new users can successfully create accounts!

## Troubleshooting

If you still get errors:
1. Make sure you're in the correct Supabase project
2. Check that the SQL ran without errors
3. Try refreshing your app page
4. Check the browser console for any error details

## File Location
The SQL fix file is located at:
```
/Users/garrettsullivan/Desktop/AUTOMATE/Vibe Code/Wabbit/clients/sullivan_realestate/Actual-clean/fix-auth-issues.sql
```

Let me know if you encounter any issues or need clarification on any step!
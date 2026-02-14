# Complete User Deletion Guide

## 🎯 Overview
Completely removing a user from Supabase requires deleting from:
1. `auth.users` (Supabase authentication system)
2. `user_profiles` (your custom table)
3. `buyer_preferences` (related data)
4. All other related tables

## 🔴 Method 1: Manual via Supabase Dashboard (Easiest)

### Step 1: Delete from Auth System
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Users**
3. Find the user by email
4. Click the three dots menu (⋮)
5. Select **"Delete user"**

### Step 2: Delete from Your Tables
1. Go to **SQL Editor**
2. Run this script (replace email):
```sql
-- Replace with actual email
DO $$
DECLARE
    user_email TEXT := 'user@example.com';
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM public.user_profiles WHERE email = user_email;
    
    IF user_uuid IS NOT NULL THEN
        DELETE FROM public.buyer_preferences WHERE user_id = user_uuid;
        DELETE FROM public.rankings WHERE user_id = user_uuid;
        DELETE FROM public.user_properties WHERE user_id = user_uuid;
        DELETE FROM public.shared_accounts WHERE primary_user_id = user_uuid OR secondary_user_id = user_uuid;
        DELETE FROM public.activity_log WHERE user_id = user_uuid;
        DELETE FROM public.user_profiles WHERE id = user_uuid;
        RAISE NOTICE 'User % deleted successfully', user_email;
    END IF;
END $$;
```

## 🟡 Method 2: Programmatic via API (From Your App)

### Setup Required:
1. Add to `.env.local`:
```env
ADMIN_DELETE_KEY=your-secret-admin-key-here
```

2. The API endpoint is already created at `/api/admin/delete-user`

### Usage from Command Line:
```bash
# Check if user exists
curl "http://localhost:3000/api/admin/delete-user?email=user@example.com"

# Delete user (be careful!)
curl -X DELETE http://localhost:3000/api/admin/delete-user \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-secret-admin-key-here" \
  -d '{"email": "user@example.com"}'
```

### Usage with Node.js Script:
```bash
# Set admin key
export ADMIN_DELETE_KEY=your-secret-admin-key-here

# Run deletion
node scripts/delete-user.js user@example.com
```

## 🟢 Method 3: From This Terminal (I Can Do It!)

Yes, I can delete users programmatically! Here's how:

```bash
# I can run this command for you:
cd ../Actual-clean && node scripts/delete-user.js user@example.com
```

**But first you need to:**
1. Set the `ADMIN_DELETE_KEY` in your `.env.local`
2. Make sure the server is running (it is currently)
3. Tell me the exact email to delete

## 🔍 Check What Data Exists for a User

Run this SQL to see all user data:
```sql
WITH user_info AS (
    SELECT id, email FROM public.user_profiles WHERE email = 'user@example.com'
)
SELECT 
    'user_profiles' as table_name, 
    COUNT(*) as records
FROM public.user_profiles
WHERE email = 'user@example.com'
UNION ALL
SELECT 
    'buyer_preferences', 
    COUNT(*)
FROM public.buyer_preferences
WHERE user_id = (SELECT id FROM user_info)
UNION ALL
SELECT 
    'rankings', 
    COUNT(*)
FROM public.rankings
WHERE user_id = (SELECT id FROM user_info)
UNION ALL
SELECT 
    'auth.users', 
    COUNT(*)
FROM auth.users
WHERE email = 'user@example.com';
```

## ⚠️ Important Notes

### What Gets Deleted:
- Authentication credentials
- User profile information
- All preferences and settings
- Rankings and property associations
- Activity logs
- Shared account connections

### What Does NOT Get Deleted:
- Properties themselves (they're shared data)
- System logs (for audit purposes)
- Email logs (if any)

### Security Considerations:
1. The API endpoint needs authentication (currently using simple key)
2. In production, add:
   - Rate limiting
   - IP whitelisting
   - Audit logging
   - Two-factor confirmation
   - Admin role checking

### Recovery:
⚠️ **Deletion is PERMANENT!** There's no undo. Make sure to:
1. Export user data first if needed
2. Confirm the correct email
3. Have database backups

## 🚀 Quick Commands

### For Testing (Delete Test User):
```bash
# From Supabase SQL Editor
DELETE FROM public.buyer_preferences WHERE user_id = (SELECT id FROM public.user_profiles WHERE email = 'test@example.com');
DELETE FROM public.user_profiles WHERE email = 'test@example.com';
-- Then delete from Auth > Users in dashboard
```

### For Production (Full Audit):
1. Export user data first
2. Log the deletion request
3. Get confirmation
4. Execute deletion
5. Send confirmation email

## 📝 Example: Delete a Specific User

To delete `gbsullivan6@gmail.com`:

### Option A: I Do It (Programmatic)
Tell me to run:
```bash
node scripts/delete-user.js gbsullivan6@gmail.com
```

### Option B: You Do It (Manual)
1. Go to Supabase Dashboard > Authentication > Users
2. Find `gbsullivan6@gmail.com`
3. Click ⋮ > Delete user
4. Run the SQL script above with that email

## 🔒 Best Practices

1. **Always confirm** the email before deletion
2. **Check dependencies** - make sure no critical data depends on this user
3. **Log deletions** for audit trail
4. **Test first** with a test account
5. **Backup** before bulk deletions

## Need Help?

- To check if a user exists: Use the GET endpoint or SQL query
- To delete programmatically: Ensure ADMIN_DELETE_KEY is set
- To delete manually: Use Supabase Dashboard
- For bulk deletions: Create a batch script with safety checks
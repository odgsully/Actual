# Supabase Email Configuration Guide

## Understanding Authentication Issues

### Where Passwords Are Stored
- **Passwords are NOT in your database tables**
- They're in Supabase's internal `auth.users` system (encrypted)
- You cannot view or edit passwords directly
- Only accessible via Supabase Auth API

### Your Current Issues
1. **"Email not confirmed"** - User created but email not verified
2. **"Invalid login credentials"** - Password incorrect or user not properly created

## How to Fix Existing Users

### Option 1: Send Password Reset (Recommended)
1. Go to Supabase Dashboard > Authentication > Users
2. Find the user (gbsullivan6@gmail.com)
3. Click the three dots menu > "Send password reset"
4. User gets email to set new password

### Option 2: Delete and Re-create
1. Delete the user from Authentication > Users
2. Have them sign up again through your app
3. They'll get confirmation email automatically

## Setting Up Email Templates in Supabase

### Step 1: Access Email Templates
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Email Templates**

### Step 2: Configure Confirmation Email
1. Click on "Confirm signup" template
2. Replace the default template with this:

**Subject Line:**
```
Welcome to Wabbit - Confirm Your Email
```

**Email Body (HTML):**
```html
<h2>Welcome to Wabbit! 🏠</h2>
<p>Your AI-powered home search assistant is almost ready.</p>
<p>Please confirm your email address to get started:</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Confirm Email Address</a></p>
<p>Or copy this link: {{ .ConfirmationURL }}</p>
<p>This link will expire in 24 hours.</p>
<p>Best regards,<br>The Wabbit Team</p>
```

### Step 3: Configure Magic Link Email
1. Click on "Magic Link" template
2. Update with:

**Subject Line:**
```
Your Wabbit Login Link
```

**Email Body:**
```html
<h2>Login to Wabbit</h2>
<p>Click the link below to login to your account:</p>
<p><a href="{{ .ConfirmationURL }}">Login to Wabbit</a></p>
<p>This link will expire in 1 hour.</p>
```

### Step 4: Configure Password Reset Email
1. Click on "Reset Password" template
2. Update with:

**Subject Line:**
```
Reset Your Wabbit Password
```

**Email Body:**
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
```

## Email Settings Configuration

### Step 1: Configure Redirect URLs
1. Go to **Authentication** > **URL Configuration**
2. Set these URLs:

**Site URL:**
```
https://wabbit-rank.ai
```

**Redirect URLs (add all):**
```
http://localhost:3000/**
https://wabbit-rank.ai/**
https://wabbit-rank.ai/rank-feed
https://wabbit-rank.ai/form
```

### Step 2: Email Settings
1. Go to **Authentication** > **Providers** > **Email**
2. Ensure these are set:
   - ✅ Enable Email provider
   - ✅ Confirm email (should be ON for production)
   - ✅ Secure email change
   - ✅ Secure password change

### Step 3: SMTP Configuration (Optional - for custom domain)
1. Go to **Settings** > **Auth**
2. Scroll to "SMTP Settings"
3. Enable custom SMTP (if you have one)
4. Or stick with Supabase's default (works fine)

## Testing Email Flow

### Test Confirmation Flow:
1. Create new user via your app signup
2. Check email for confirmation
3. Click link
4. Should redirect to `/rank-feed` or `/form`

### Test Password Reset:
```javascript
// Add this function to your auth context if needed
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://wabbit-rank.ai/reset-password',
  })
  return { error }
}
```

## Quick Fixes for Your Current Users

### For gbsullivan6@gmail.com:
```sql
-- Run in SQL Editor to check if user exists
SELECT id, email, confirmed_at, created_at 
FROM auth.users 
WHERE email = 'gbsullivan6@gmail.com';
```

If user exists but `confirmed_at` is NULL:
1. Send them a password reset email
2. Or manually confirm in Dashboard (click user > Edit > Toggle "Email confirmed")

### For garrettbsullivan@outlook.com:
Same process - check if confirmed, send reset if needed.

## Important Notes

1. **Development vs Production:**
   - In development, you might want to disable email confirmation
   - In production, always require confirmation

2. **Rate Limits:**
   - Supabase free tier: 3 emails per hour
   - Upgrade for higher limits

3. **Email Deliverability:**
   - Check spam folders
   - Add wabbit-rank.ai to allowed senders
   - Consider custom SMTP for better delivery
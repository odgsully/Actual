# Email Verification Flow Test Guide

## Testing the Complete Flow

### Step 1: Access the Preferences Form
1. Go to http://localhost:3000
2. Click on "Preferences Form" card (no sign-in required)

### Step 2: Fill Out the Form
Navigate through all 9 pages of the form:
1. **Search Profile** - Enter any name or skip
2. **Property Preferences** - Select property type
3. **Size & Budget** - Enter min sqft, lot size, price range
4. **Commute** - Add commute addresses (optional)
5. **Room Requirements** - Set bedrooms/bathrooms
6. **Location** - Select cities and zip codes
7. **Home Features** - Choose pool, garage, HOA preferences
8. **Current Residence** - Add current address feedback
9. **Complete Profile** - Enter email, first name, last name

### Step 3: Submit Form
- Review the summary displayed on page 9
- Click "Submit & Create Account"
- Check browser console for verification URL (in development)

### Step 4: Email Verification
In development mode:
1. Check console for "Verification URL" log
2. Copy the URL (format: http://localhost:3000/setup/[token])
3. Navigate to this URL in browser

In production:
- User would receive an email with the verification link

### Step 5: Complete Account Setup
On the setup page:
1. Review preferences summary
2. Create a password (min 8 characters)
3. Confirm password
4. Accept Terms of Service and Privacy Policy (required)
5. Optionally opt-in to marketing emails
6. Click "Complete Setup & Sign In"

### Step 6: Verify Success
- Account should be created
- User should be automatically signed in
- Should redirect to /rank-feed

## Console Output to Expect

When submitting form:
```
=====================================
VERIFICATION EMAIL (Development Mode)
=====================================
To: user@example.com
Subject: Complete Your Wabbit Account Setup
Content: [Email content with preferences]
Verification URL: http://localhost:3000/setup/[token]
=====================================
```

## Database Verification

Check that data is saved correctly:
1. Temporary preferences stored in `temporary_preferences` table
2. After setup completion:
   - Auth user created in Supabase Auth
   - User profile created in `user_profiles` table
   - Temporary preferences deleted

## Error Cases to Test

1. **Duplicate Email**: Try using an email that already has an account
2. **Expired Token**: Wait 24+ hours before using verification link
3. **Invalid Token**: Modify the token in URL
4. **Password Mismatch**: Enter different passwords
5. **Missing Required Fields**: Try submitting without email/name
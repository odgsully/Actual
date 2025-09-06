# Authentication & Form Flow Test Scenarios

## Test Environment Setup
- URL: http://localhost:3000
- Test Accounts:
  - Demo: support@wabbit-rank.ai
  - Test User 1: gbsullivan6@gmail.com
  - New Test User: Create via signup flow

## 1. New User Signup Flow ✅

### Steps:
1. Navigate to `/signup`
2. Fill in:
   - First Name: Test
   - Last Name: User
   - Email: testuser@example.com
   - Password: password123
   - Confirm Password: password123
   - ✅ Accept privacy statement
   - ✅ Subscribe to updates (optional)
3. Click "Create Account"

### Expected Results:
- ✅ User profile created in `auth.users`
- ✅ User profile created in `user_profiles` table
- ✅ Automatic sign-in after signup
- ✅ Redirect to `/form` after 1 second
- ✅ Form shows **8 steps** (not 9)
- ✅ Step 8 has "Submit My Preferences" button
- ✅ User email/name pre-filled from profile

### Common Issues & Fixes Applied:
- **Issue**: Form showed 9 steps after signup
- **Fix**: Increased redirect delay to 1000ms, fixed auth state detection
- **Issue**: Preferences not saving
- **Fix**: Authenticated users now use `/api/preferences/save`

## 2. Existing User Sign In Flow ✅

### Steps:
1. Navigate to `/signin`
2. Enter email and password
3. Click "Sign In"

### Expected Results:
- ✅ Successful authentication
- ✅ Redirect to `/rank-feed`
- ✅ Session persists across page refreshes
- ✅ Form shows 8 steps with loaded preferences

## 3. Password Reset Flow ✅

### Steps:
1. Navigate to `/signin`
2. Click "Forgot your password?"
3. Enter email address
4. Click "Send Reset Link"
5. Check email for reset link
6. Click link in email
7. Enter new password twice
8. Click "Reset Password"

### Expected Results:
- ✅ Email sent with reset link
- ✅ Link redirects to `/auth/reset-password`
- ✅ Password successfully updated
- ✅ Redirect to `/signin`
- ✅ Can sign in with new password

## 4. Form Preferences Flow ✅

### For New Users (After Signup):
1. Complete 8-step form
2. Click "Submit My Preferences"

### Expected Results:
- ✅ Preferences saved to `buyer_preferences` table
- ✅ Success modal shown
- ✅ Option to go to Rank Feed

### For Existing Users (Edit Mode):
1. Sign in
2. Navigate to `/form`
3. See existing preferences loaded
4. Make changes
5. Click "Submit My Preferences"

### Expected Results:
- ✅ Existing preferences loaded correctly
- ✅ Changes saved to database
- ✅ "Preferences Updated!" message shown

## 5. Edge Cases & Error Handling ✅

### Test Scenarios:

#### Empty Form Submission:
- **Test**: Submit form without required fields
- **Expected**: Error message, form not submitted

#### Duplicate Email Signup:
- **Test**: Sign up with existing email
- **Expected**: "Email already exists" error

#### Invalid Credentials:
- **Test**: Sign in with wrong password
- **Expected**: "Invalid login credentials" error

#### Email Not Confirmed:
- **Test**: Sign in before confirming email
- **Expected**: "Email not confirmed" message

#### Network Error During Save:
- **Test**: Disconnect network, submit preferences
- **Expected**: Error alert, no partial save

## 6. Database Verification Queries

### Check User Exists:
```sql
SELECT * FROM auth.users WHERE email = 'testuser@example.com';
```

### Check User Profile:
```sql
SELECT * FROM public.user_profiles WHERE email = 'testuser@example.com';
```

### Check Preferences:
```sql
SELECT * FROM public.buyer_preferences WHERE user_id = (
  SELECT id FROM public.user_profiles WHERE email = 'testuser@example.com'
);
```

## 7. Manual Testing Checklist

### New User Journey:
- [ ] Can create account
- [ ] Email confirmation works (if enabled)
- [ ] Auto-login after signup
- [ ] Form shows 8 steps
- [ ] Preferences save successfully
- [ ] Can access Rank Feed

### Existing User Journey:
- [ ] Can sign in
- [ ] Forgot password works
- [ ] Form loads saved preferences
- [ ] Can edit and save preferences
- [ ] Session persists on refresh
- [ ] Sign out works

### UI/UX Checks:
- [ ] Loading states show during operations
- [ ] Error messages are clear
- [ ] Success messages display
- [ ] Form navigation works
- [ ] Mobile responsive
- [ ] No console errors

## 8. Common Issues & Solutions

### "Failed to save preferences"
**Cause**: Wrong API endpoint or missing columns
**Solution**: Check console for specific error, verify database schema

### Form shows 9 steps for authenticated user
**Cause**: Auth state not detected properly
**Solution**: Check loading state, ensure user object exists

### "Email not confirmed" error
**Cause**: Email verification required in Supabase
**Solution**: 
1. Check email for confirmation link
2. Or disable email confirmation in Supabase for development

### "Invalid login credentials"
**Cause**: Wrong password or user doesn't exist
**Solution**: Use password reset flow or create new account

## 9. Automated Test Example

```javascript
// __tests__/auth-flow.test.js
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Authentication Flow', () => {
  test('New user signup shows 8-step form', async () => {
    // 1. Navigate to signup
    render(<SignUpPage />)
    
    // 2. Fill form
    await userEvent.type(screen.getByLabelText(/first name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/last name/i), 'User')
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.type(screen.getByLabelText(/confirm/i), 'password123')
    await userEvent.click(screen.getByLabelText(/privacy/i))
    
    // 3. Submit
    await userEvent.click(screen.getByText(/create account/i))
    
    // 4. Wait for redirect
    await waitFor(() => {
      expect(window.location.pathname).toBe('/form')
    }, { timeout: 2000 })
    
    // 5. Verify 8 steps
    expect(screen.getByText(/Step 1 of 8/i)).toBeInTheDocument()
    
    // 6. Navigate to last step
    // ... navigate to step 8
    
    // 7. Verify button text
    expect(screen.getByText(/Submit My Preferences/i)).toBeInTheDocument()
  })
})
```

## 10. Production Deployment Checklist

Before going to production:
- [ ] Email templates configured in Supabase
- [ ] Redirect URLs set correctly
- [ ] RLS policies properly configured
- [ ] Error tracking enabled
- [ ] Rate limiting configured
- [ ] SSL certificates valid
- [ ] Environment variables set
- [ ] Database backups configured
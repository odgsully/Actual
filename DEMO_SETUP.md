# Demo Mode Setup Instructions

## Demo Account Credentials
- **Email:** support@wabbit-rank.ai
- **Password:** 17026ZvSe!!

## How Demo Mode Works

1. **Full Demo Button**: On the homepage, clicking the "Full Demo" button will automatically sign in with the demo account credentials and navigate directly to the List View page.

2. **Demo Banner**: When in demo mode, a banner appears at the bottom of all pages showing "DEMO MODE" with a link to return to the main menu.

3. **Sample Data**: The demo account comes pre-populated with:
   - 4 sample properties in Scottsdale, Phoenix, and Paradise Valley
   - Sample rankings for properties
   - Pre-filled buyer preferences

## Setting Up the Demo Account

### Option 1: Create New Demo Account with Sample Data
```bash
npm run db:seed-demo
```
This will create the demo account and populate it with all sample data.

### Option 2: Update Existing Demo Account Password
```bash
npm run db:update-demo
```
This will update the password for an existing demo account or create it if it doesn't exist.

## Troubleshooting

### If Demo Sign-In Fails:

1. **Check Supabase Configuration**
   - Ensure your `.env.local` file has the correct Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

2. **Create/Update Demo Account**
   ```bash
   npm run db:update-demo
   ```

3. **Check Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Users
   - Verify that `support@wabbit-rank.ai` exists
   - Check that email is confirmed

4. **Manual Password Reset** (if needed)
   - In Supabase dashboard, go to Authentication > Users
   - Find `support@wabbit-rank.ai`
   - Click on the user and select "Send password reset"
   - Or use "Update password" to set it to `17026ZvSe!!`

## Testing Demo Mode

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. Click the "Full Demo" button

4. You should be automatically signed in and redirected to the List View page

5. Verify the demo banner appears at the bottom of the screen

6. Click "Click here to return to Menu" in the demo banner to sign out and return to the homepage

## Notes

- The demo account is designed for showcasing the platform's features
- All data in demo mode is sample data and can be reset at any time
- Regular users cannot access the demo account through normal sign-in (it's auto-signin only)
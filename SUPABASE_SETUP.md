# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in:
   - Project name: `wabbit-realestate` (or your preferred name)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the closest to your users
   - Pricing Plan: Free tier is fine for development

## 2. Get Your API Keys

Once your project is created:

1. Go to **Settings** → **API**
2. You'll need two keys:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **Anon/Public Key**: Safe to use in browser (starts with `eyJ...`)
   - **Service Role Key**: Keep this secret! Only use server-side (also starts with `eyJ...`)

## 3. Set Up Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Other configurations
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Security Notes:**
- Never commit `.env.local` to git
- The `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to the client
- Only use it in server-side scripts and API routes

## 4. Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `database-schema.sql` from this project
4. Paste and run the query
5. This will create all necessary tables and relationships

## 5. Create the Demo Account

After setting up your environment variables, run:

```bash
npm run db:update-demo
```

This will create the demo account with:
- Email: `support@wabbit-rank.ai`
- Password: `17026ZvSe!!`

To also add sample data:

```bash
npm run db:seed-demo
```

## 6. Enable Authentication

In Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Ensure "Email" is enabled
3. Go to **Authentication** → **Settings**
4. Under "Auth Providers", configure:
   - Enable email confirmations: OFF (for development)
   - Or set up SMTP for production

## 7. Configure Row Level Security (Optional but Recommended)

The database schema includes RLS policies. To enable them:

1. Go to **Authentication** → **Policies**
2. For each table, ensure RLS is enabled
3. The policies are already defined in the schema

## 8. Test Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Try the following:
   - Click "Sign Up" and create a new account
   - Click "Full Demo" to test auto-signin
   - Navigate to protected pages

## Troubleshooting

### "Missing environment variables" Error

Make sure your `.env.local` file contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### "Invalid API key" Error

- Check that you copied the keys correctly
- Ensure you're using the right key in the right place:
  - Anon key for client-side code
  - Service role key for admin scripts

### Demo Account Not Working

1. Check Supabase Dashboard → Authentication → Users
2. Verify `support@wabbit-rank.ai` exists
3. Ensure email is confirmed
4. Run `npm run db:update-demo` to reset password

### Database Tables Not Found

Run the database schema SQL in Supabase SQL Editor:
- Copy contents of `database-schema.sql`
- Run in SQL Editor

## Production Deployment

For production:

1. Use environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Enable email confirmations in Supabase
3. Set up proper SMTP for email sending
4. Enable and configure Row Level Security
5. Use a strong database password
6. Consider upgrading from free tier for better performance

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
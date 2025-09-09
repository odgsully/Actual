# Production Environment Variables

## Generated CRON_SECRET
```
CRON_SECRET=0432ad329ba9f7176235c76f441e0eff0b0b26fba15bb5a842931564302c310d
```

## Required Variables (copy from .env.local)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- OPENAI_API_KEY
- NEXT_PUBLIC_APP_URL (set to your Vercel URL)

## Optional Variables
- ALERT_WEBHOOK_URL (for Slack/Discord notifications)

---

**Important**: Add these to Vercel Dashboard → Settings → Environment Variables
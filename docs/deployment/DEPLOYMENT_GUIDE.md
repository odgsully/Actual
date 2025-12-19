# Wabbit Property Scraping - Deployment Guide
## Step-by-Step Instructions for Vercel Deployment

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Completed Items
- [x] Supabase database configured
- [x] Environment variables set locally
- [x] All scrapers implemented
- [x] API endpoints created
- [x] Cron jobs configured in vercel.json
- [x] Playwright browsers installed
- [x] System verification passed

### ⚠️ Required Actions
- [ ] Install Vercel CLI
- [ ] Generate CRON_SECRET
- [ ] Deploy to Vercel
- [ ] Configure production environment variables

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Install Vercel CLI
```bash
# Install globally
npm install -g vercel

# Verify installation
vercel --version
```

### Step 2: Generate CRON_SECRET
```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Save this value - you'll need it for Vercel environment variables
```

### Step 3: Initial Deployment
```bash
# Login to Vercel (if not already logged in)
vercel login

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: (select your account)
# - Link to existing project? N
# - Project name: wabbit-property-scraping
# - Directory: ./
# - Override settings? N
```

### Step 4: Production Deployment
```bash
# After initial deployment, deploy to production
vercel --prod
```

### Step 5: Configure Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) and add these environment variables:

```env
# Required Variables (copy from .env.local)
NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
SUPABASE_SERVICE_ROLE_KEY=your_value
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_value
OPENAI_API_KEY=your_value
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# Cron Authentication (use generated secret from Step 2)
CRON_SECRET=your_generated_secret

# Optional Monitoring
ALERT_WEBHOOK_URL=your_webhook_url (if using Slack/Discord alerts)
```

### Step 6: Verify Cron Jobs

1. Go to Vercel Dashboard → Your Project → Functions → Cron
2. Verify 3 cron jobs are listed:
   - `/api/cron/hourly-scrape` (0 * * * *)
   - `/api/cron/daily-cleanup` (0 3 * * *)
   - `/api/cron/check-health` (*/15 * * * *)

### Step 7: Test Production Endpoints

```bash
# Replace YOUR_PROJECT with your Vercel project URL

# Test health endpoint
curl https://YOUR_PROJECT.vercel.app/api/health

# Test monitoring dashboard
curl https://YOUR_PROJECT.vercel.app/api/admin/monitoring

# Manually trigger hourly scrape (replace YOUR_CRON_SECRET)
curl -X POST https://YOUR_PROJECT.vercel.app/api/cron/hourly-scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🔧 POST-DEPLOYMENT CONFIGURATION

### 1. Monitor Initial Cron Execution

Watch the first automated hourly scrape:
```bash
# View live logs
vercel logs --follow

# Or check in Vercel Dashboard → Functions → Logs
```

### 2. Set Up Error Monitoring (Optional but Recommended)

#### Option A: Sentry
1. Create account at [sentry.io](https://sentry.io)
2. Create new project for Next.js
3. Add to environment variables:
   ```env
   SENTRY_DSN=your_sentry_dsn
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```

#### Option B: Webhook Alerts
1. Create Slack/Discord webhook
2. Add to environment variables:
   ```env
   ALERT_WEBHOOK_URL=your_webhook_url
   ```

### 3. Configure Custom Domain (Optional)

If using custom domain (e.g., wabbit-rank.ai):
1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update NEXT_PUBLIC_APP_URL environment variable

---

## 📊 MONITORING & MAINTENANCE

### Daily Monitoring Tasks
```bash
# Check system health
curl https://YOUR_PROJECT.vercel.app/api/health

# View scraping metrics (last 24 hours)
curl https://YOUR_PROJECT.vercel.app/api/admin/monitoring?range=24h

# Check error logs
vercel logs --since 24h | grep ERROR
```

### Weekly Maintenance
```bash
# Review scraping success rates
curl https://YOUR_PROJECT.vercel.app/api/admin/monitoring?range=7d

# Check database growth
# Run in Supabase SQL Editor:
SELECT 
  COUNT(*) as total_properties,
  COUNT(DISTINCT city) as cities,
  AVG(list_price) as avg_price,
  MAX(updated_at) as last_update
FROM properties
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🚨 TROUBLESHOOTING

### Issue: Cron jobs not running
**Solution:**
1. Verify CRON_SECRET is set in Vercel environment
2. Check vercel.json has correct cron configuration
3. Manually trigger to test: 
   ```bash
   curl -X POST https://YOUR_PROJECT.vercel.app/api/cron/hourly-scrape \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Issue: Scrapers returning 0 properties
**Solution:**
1. Check Vercel Function logs for errors
2. Verify Playwright compatibility (may need different config for Vercel)
3. Consider implementing proxy service

### Issue: Function timeouts
**Solution:**
1. Increase maxDuration in route files (max 300s for Pro plan)
2. Reduce number of properties per scrape
3. Implement queue batching

### Issue: Database connection errors
**Solution:**
1. Verify Supabase credentials in Vercel environment
2. Check Supabase connection pooling settings
3. Ensure Row Level Security is properly configured

---

## 📈 OPTIMIZATION TIPS

### For Better Scraping Success:
1. **Add Proxy Service**
   ```javascript
   // In scraper configuration
   const proxy = {
     server: 'http://proxy.example.com:8080',
     username: 'user',
     password: 'pass'
   };
   ```

2. **Implement User-Agent Rotation**
   ```javascript
   const userAgents = [
     // Add 10-15 different user agents
   ];
   ```

3. **Add Request Delays**
   ```javascript
   // Random delay between 3-8 seconds
   const delay = Math.floor(Math.random() * 5000) + 3000;
   await new Promise(resolve => setTimeout(resolve, delay));
   ```

### For Better Performance:
1. **Enable Vercel Edge Functions** (if available)
2. **Use Vercel KV** for caching
3. **Implement ISR** for admin dashboard

---

## 📞 SUPPORT & RESOURCES

### Vercel Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Function Logs](https://vercel.com/dashboard/[project]/functions)

### Monitoring URLs
- Health Check: `/api/health`
- Admin Dashboard: `/api/admin/monitoring`
- Cron Status: Vercel Dashboard → Functions → Cron

### Emergency Contacts
- Vercel Status: [status.vercel.com](https://status.vercel.com)
- Supabase Status: [status.supabase.com](https://status.supabase.com)

---

## ✅ DEPLOYMENT COMPLETE CHECKLIST

After deployment, verify:
- [ ] All environment variables set in Vercel
- [ ] Production URL is accessible
- [ ] Health endpoint returns success
- [ ] Cron jobs are scheduled
- [ ] First hourly scrape executed
- [ ] Monitoring dashboard works
- [ ] Error logging configured
- [ ] Database connections stable

---

## 🎉 SUCCESS INDICATORS

Your deployment is successful when:
1. ✅ Health endpoint returns `{"status":"healthy"}`
2. ✅ Cron jobs show in Vercel dashboard
3. ✅ First properties appear in database
4. ✅ No critical errors in logs
5. ✅ Monitoring dashboard shows metrics

---

*Deployment Guide Version: 1.0*
*Last Updated: January 9, 2025*
*Estimated Deployment Time: 30-45 minutes*
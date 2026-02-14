# Wabbit Property Scraping - Operations Guide
## Last Updated: January 9, 2025

## 🚀 Quick Start

### System URLs
- **Production**: https://actual-1vmhv4xlo-odgsullys-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/odgsullys-projects/actual
- **Supabase Dashboard**: https://app.supabase.com

### Monitoring Script
```bash
# Check production status
node scripts/monitor-scraping.js

# Check local development
node scripts/monitor-scraping.js --local

# Trigger manual scrape
node scripts/monitor-scraping.js --trigger
```

---

## ⏰ Cron Job Schedule

| Job | Schedule | Description | Next Run |
|-----|----------|-------------|----------|
| **Hourly Scrape** | `0 * * * *` | Scrapes properties for active users | Every hour at :00 |
| **Health Check** | `*/15 * * * *` | System health monitoring | Every 15 minutes |
| **Daily Cleanup** | `0 3 * * *` | Database maintenance | 3:00 AM daily |

---

## 📊 Daily Operations Checklist

### Morning (9 AM)
- [ ] Check Vercel Dashboard for overnight cron executions
- [ ] Review scraping metrics in Supabase:
```sql
SELECT * FROM scraping_metrics 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```
- [ ] Check for errors:
```sql
SELECT COUNT(*), source, error_type 
FROM scraping_errors 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY source, error_type;
```

### Afternoon (2 PM)
- [ ] Monitor active queue:
```bash
node scripts/monitor-scraping.js
```
- [ ] Check user notifications sent:
```sql
SELECT COUNT(*) as notifications_sent
FROM property_notifications
WHERE sent_at > NOW() - INTERVAL '24 hours';
```

### Evening (6 PM)
- [ ] Review daily summary:
```sql
-- Properties scraped today
SELECT 
  COUNT(*) as total_properties,
  COUNT(DISTINCT city) as cities_covered,
  AVG(match_score) as avg_match_score
FROM properties
WHERE created_at > CURRENT_DATE;

-- User activity
SELECT COUNT(DISTINCT user_id) as active_users
FROM user_scraping_quota
WHERE hourly_used > 0
AND last_reset_hourly > CURRENT_DATE;
```

---

## 🔧 Common Operations

### 1. Trigger Manual Scrape
```bash
curl -X POST https://actual-1vmhv4xlo-odgsullys-projects.vercel.app/api/cron/hourly-scrape \
  -H "Authorization: Bearer 0432ad329ba9f7176235c76f441e0eff0b0b26fba15bb5a842931564302c310d"
```

### 2. Check System Health
```bash
# Local
curl http://localhost:3000/api/health

# Production (requires auth)
curl https://actual-1vmhv4xlo-odgsullys-projects.vercel.app/api/health
```

### 3. View Queue Status
```bash
curl http://localhost:3000/api/admin/monitoring | python3 -m json.tool
```

### 4. Clear Blocked URLs
```sql
-- Remove expired blocks
DELETE FROM blocked_urls 
WHERE expires_at < NOW();

-- Clear all blocks for a source
DELETE FROM blocked_urls 
WHERE source = 'zillow';
```

### 5. Reset User Quota
```sql
-- Reset specific user
UPDATE user_scraping_quota
SET hourly_used = 0, daily_used = 0
WHERE user_id = 'USER_UUID_HERE';

-- Reset all users (use carefully)
UPDATE user_scraping_quota
SET hourly_used = 0, last_reset_hourly = NOW();
```

---

## 📈 Performance Monitoring

### Key Metrics to Track

#### Scraping Performance
```sql
SELECT 
  source,
  AVG(properties_processed) as avg_processed,
  AVG(properties_saved) as avg_saved,
  AVG(duration_ms)/1000 as avg_duration_sec,
  SUM(errors) as total_errors
FROM scraping_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY source;
```

#### User Engagement
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN viewed = true THEN 1 END) as viewed_notifications
FROM property_notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### Property Quality
```sql
SELECT 
  city,
  COUNT(*) as property_count,
  AVG(match_score) as avg_match,
  MAX(match_score) as best_match
FROM properties
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY city
ORDER BY property_count DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Issue: Scrapers Not Running

1. **Check Vercel Logs**:
```bash
vercel logs --follow
```

2. **Verify Environment Variables**:
- Go to Vercel Dashboard → Settings → Environment Variables
- Ensure all required variables are set

3. **Check Database Connection**:
```bash
node scripts/verify-setup.js
```

### Issue: High Error Rate

1. **Check Error Logs**:
```sql
SELECT * FROM scraping_errors
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

2. **Review Blocked URLs**:
```sql
SELECT * FROM blocked_urls
WHERE blocked_at > NOW() - INTERVAL '24 hours';
```

3. **Restart Queue** (if needed):
```bash
# Clear stuck jobs
curl -X POST http://localhost:3000/api/admin/queue/clear
```

### Issue: No Properties Being Saved

1. **Check Active Users**:
```sql
SELECT COUNT(*) FROM buyer_preferences
WHERE completed_at IS NOT NULL;
```

2. **Verify Scrapers**:
```bash
node scripts/test-scrapers.js
```

3. **Check Rate Limits**:
```sql
SELECT * FROM user_scraping_quota
WHERE hourly_used >= hourly_limit;
```

---

## 🔐 Security & Maintenance

### Weekly Tasks
- [ ] Review error logs for patterns
- [ ] Check blocked URLs and clear if needed
- [ ] Verify backup status in Supabase
- [ ] Review user quota usage

### Monthly Tasks
- [ ] Analyze scraping performance trends
- [ ] Update rate limits if needed
- [ ] Review and optimize slow queries
- [ ] Check Vercel usage and costs

### Environment Variables (Keep Secure!)
```
CRON_SECRET=0432ad329ba9f7176235c76f441e0eff0b0b26fba15bb5a842931564302c310d
```
**Never commit this to version control!**

---

## 📞 Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Documentation**: See project README.md

---

## 🎯 Success Indicators

Your scraping system is healthy when:
- ✅ Error rate < 10%
- ✅ Properties scraped per hour > 100
- ✅ Queue processing time < 5 minutes
- ✅ User notifications delivered < 1 hour
- ✅ All cron jobs running on schedule

---

## 📝 Notes

- System designed for Maricopa County, Arizona only
- Rate limits: 100-150 requests/hour per source
- Free tier: 10 requests/hour per user
- Cron jobs use MST/Arizona timezone (no DST)
- Playwright browsers required for local scraping
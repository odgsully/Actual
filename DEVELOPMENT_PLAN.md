# Wabbit Property Scraping - Development Plan
## January 9, 2025

## 🎯 Objective
Deploy and optimize the property scraping system for production use with Maricopa County real estate data.

---

## Phase 1: Foundation Verification (Day 1-2)
**Priority: CRITICAL**
**Status: Ready to Start**

### 1.1 Database Setup
- [ ] Run `database-schema.sql` on Supabase
- [ ] Run `migrations/002_add_scraping_tables.sql`
- [ ] Create `property-images` storage bucket in Supabase
- [ ] Verify Row Level Security policies are active
- [ ] Test database connections with service role key

### 1.2 Environment Configuration
```env
# Required variables to set:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
ALERT_WEBHOOK_URL= (optional)
```

### 1.3 Local Testing
```bash
# Test individual scrapers
npm run dev
# Test Zillow
curl -X POST http://localhost:3000/api/scrape/test \
  -H "Content-Type: application/json" \
  -d '{"source": "zillow", "searchCriteria": {"city": "Scottsdale", "minPrice": 500000, "maxPrice": 1000000}}'

# Test Redfin
curl -X POST http://localhost:3000/api/scrape/test \
  -H "Content-Type: application/json" \
  -d '{"source": "redfin", "searchCriteria": {"city": "Phoenix"}}'

# Test Homes.com
curl -X POST http://localhost:3000/api/scrape/test \
  -H "Content-Type: application/json" \
  -d '{"source": "homes", "searchCriteria": {"city": "Mesa"}}'
```

---

## Phase 2: Deployment (Day 2-3)
**Priority: HIGH**
**Dependencies: Phase 1 complete**

### 2.1 Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Verify deployment
curl https://wabbit-rank.ai/api/health
```

### 2.2 Cron Job Verification
- [ ] Check Vercel Dashboard → Functions → Cron
- [ ] Verify 3 cron jobs are scheduled:
  - Hourly scrape (0 * * * *)
  - Daily cleanup (0 3 * * *)
  - Health check (*/15 * * * *)
- [ ] Monitor first hourly run in logs

### 2.3 Initial Data Population
```bash
# Trigger manual scrape for initial data
curl -X POST https://wabbit-rank.ai/api/cron/hourly-scrape \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Phase 3: Monitoring & Optimization (Day 3-4)
**Priority: HIGH**
**Dependencies: Phase 2 complete**

### 3.1 Monitoring Setup
- [ ] Configure alert webhook for failures
- [ ] Set up Vercel Analytics
- [ ] Create monitoring dashboard at `/admin/monitoring`
- [ ] Implement error tracking (Sentry recommended)

### 3.2 Performance Optimization

#### Queue Optimization
```typescript
// lib/scraping/queue-manager.ts adjustments
- Increase concurrent jobs to 3 per source
- Implement adaptive rate limiting based on success rate
- Add priority queue for user-triggered scrapes
```

#### Database Optimization
```sql
-- Add missing indexes
CREATE INDEX idx_properties_scraped ON properties(last_scraped_at);
CREATE INDEX idx_properties_match ON properties(match_score DESC);
CREATE INDEX idx_notifications_pending ON property_notifications(sent_at) WHERE sent_at IS NULL;
```

#### Image Optimization
- [ ] Implement lazy loading for additional images
- [ ] Add CDN caching headers
- [ ] Consider WebP conversion for all images

### 3.3 Error Recovery
- [ ] Implement automatic retry for failed scrapes
- [ ] Add URL blocklist management
- [ ] Create admin interface for manual intervention

---

## Phase 4: User Features (Day 4-5)
**Priority: MEDIUM**
**Dependencies: Phase 3 complete**

### 4.1 User Dashboard
Create `/dashboard/scraping` with:
- [ ] Real-time scraping status
- [ ] Quota usage display
- [ ] Recent matches list
- [ ] Notification preferences UI

### 4.2 Search Area Polygons
- [ ] Integrate Google Maps drawing tools
- [ ] Store polygon data in `user_search_areas` table
- [ ] Update property matching to use spatial queries
- [ ] Add PostGIS extension for proper geo queries

### 4.3 Enhanced Notifications
- [ ] Email templates for property matches
- [ ] SMS notifications (Twilio integration)
- [ ] In-app notification center
- [ ] Digest email scheduling

---

## Phase 5: Scale & Reliability (Day 5-7)
**Priority: MEDIUM**
**Dependencies: Phase 4 complete**

### 5.1 Scaling Preparation
- [ ] Implement Redis for queue management
- [ ] Add worker processes for scraping
- [ ] Set up database read replicas
- [ ] Implement connection pooling

### 5.2 Data Quality
- [ ] Add property data validation
- [ ] Implement duplicate detection improvements
- [ ] Create data quality dashboard
- [ ] Add manual review queue for anomalies

### 5.3 Advanced Features
- [ ] AI-powered property descriptions
- [ ] Market trend analysis
- [ ] Comparative market analysis (CMA)
- [ ] Investment ROI calculations

---

## 📊 Success Metrics

### Week 1 Goals
- ✅ 10,000+ properties scraped
- ✅ <1% error rate
- ✅ 100+ active users
- ✅ 5 second average response time

### Month 1 Goals
- ✅ 50,000+ properties in database
- ✅ 1,000+ active users
- ✅ 80% match accuracy
- ✅ 99.9% uptime

---

## 🚨 Risk Mitigation

### Technical Risks
1. **Scraper Blocking**
   - Solution: Rotate user agents, use residential proxies
   - Backup: Multiple scraper implementations

2. **Rate Limiting**
   - Solution: Adaptive throttling, distributed scraping
   - Backup: Manual data import capability

3. **Database Overload**
   - Solution: Query optimization, caching layer
   - Backup: Database scaling plan ready

### Business Risks
1. **Legal Compliance**
   - Review Terms of Service for each source
   - Implement robots.txt compliance
   - Add data usage disclaimers

2. **Data Accuracy**
   - Cross-reference multiple sources
   - User reporting system
   - Regular data audits

---

## 🔧 Development Commands

### Testing
```bash
npm test                    # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:scrapers      # Test all scrapers
```

### Database
```bash
npm run db:migrate         # Run migrations
npm run db:seed           # Seed test data
npm run db:reset          # Reset database
```

### Monitoring
```bash
npm run monitor:health     # Check system health
npm run monitor:metrics   # View performance metrics
npm run monitor:errors    # Review error logs
```

---

## 📝 Daily Checklist

### Morning (9 AM)
- [ ] Check overnight scraping metrics
- [ ] Review error logs
- [ ] Verify cron job execution
- [ ] Check user notifications sent

### Afternoon (2 PM)
- [ ] Monitor real-time performance
- [ ] Review queue status
- [ ] Check rate limit usage
- [ ] Verify data quality

### Evening (6 PM)
- [ ] Daily metrics summary
- [ ] Plan next day priorities
- [ ] Update stakeholders
- [ ] Backup critical data

---

## 🎯 Next Immediate Steps

1. **NOW**: Verify Supabase connection and run migrations
2. **NEXT**: Test scrapers locally with real searches
3. **THEN**: Deploy to Vercel and monitor first cron run
4. **FINALLY**: Implement user dashboard for visibility

---

## 📞 Support & Resources

- **Documentation**: `/docs/scraping-system.md`
- **API Reference**: `/docs/api-reference.md`
- **Troubleshooting**: `/docs/troubleshooting.md`
- **Team Slack**: #wabbit-scraping
- **On-call**: Check PagerDuty rotation

---

## Notes
- System designed for Maricopa County, Arizona only
- Free tier: 10 requests/hour per user
- Premium tier: Unlimited (coming soon)
- All times in MST/Arizona timezone
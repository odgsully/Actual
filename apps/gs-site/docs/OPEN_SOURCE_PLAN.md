# GS Site Open Source Plan

## Recommended Approach: `git-filter-repo` + Public Upstream / Private Fork

### The Architecture

```
[Public Repo: gs-dashboard]     <── clean, generic, OSS
        ↑ upstream
[Private Fork: gs-site]         <── your production version with secrets/personal config
```

**Public repo** = the "product" — generic, self-hostable personal dashboard. No secrets, no `odgsully`, no `pickleballisapsyop.com`.

**Private fork** = your deployment. Pulls updates FROM public, has your real `.env`, personal tile configs, and any private integrations.

### Why This Over Alternatives

| Strategy | Verdict |
|----------|---------|
| `git subtree` | Good for bidirectional sync but messy history |
| `git filter-branch` | Deprecated, slow, git docs literally say "don't use this" |
| **`git-filter-repo`** | **Modern standard. Fast. Clean.** |
| Separate repo (no history) | Loses all your commit history — wastes credibility signal |

---

## What Needs to Change for the Public Version

The codebase is **~60% ready** — no private workspace deps, all npm packages, graceful degradation on missing APIs. The main work:

### Blockers (must fix)

1. **Hardcoded usernames** — `odgsully` in 6+ files (GitHub tiles, API routes, hooks). Move to `GITHUB_USERNAME` env var
2. **Personal data files** — `apple-contacts-12.25.25.vcf` (243KB of contacts), `ngrok_recovery_codes.txt`
3. **Domain hardcoding** — `pickleballisapsyop.com` in layout.tsx and next.config.js → env var

### Medium Priority

4. **Feature flags for integrations** — not everyone has LIFX bulbs or a WHOOP. Add `ENABLE_LIFX=true/false` pattern so tiles gracefully hide
5. **Default tile set** — the 53 tiles in `lib/data/tiles.ts` are personal. Ship a sensible "starter" set (GitHub, habits, calendar, forms) and document how to add custom ones
6. **`userId = 'default-user'`** pattern — document this is single-tenant by design (that's fine for a personal dashboard, just be upfront about it)

### Polish for Senior-Level Presentation

7. **README** with screenshots, feature matrix, one-click Vercel deploy button, architecture diagram
8. **`.env.example`** with all 24+ vars, clearly marked required vs. optional
9. **`CONTRIBUTING.md`** + **MIT LICENSE** + **`CODE_OF_CONDUCT.md`**
10. **GitHub Actions** — lint, typecheck, build on PR (shows the repo is maintained)

---

## Codebase Audit: Current State

### Environment Variables (24+)

#### Core Infrastructure
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Third-Party OAuth/APIs
- `NOTION_API_KEY` + 2 database IDs
- `GITHUB_PAT`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- `WHOOP_CLIENT_ID` + `WHOOP_CLIENT_SECRET`
- `YOUTUBE_API_KEY` + `YOUTUBE_CHANNEL_ID`
- `TWITTER_BEARER_TOKEN`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`
- `LIFX_API_TOKEN`
- `BROTHER_PRINTER_IP`
- `DD_API_KEY` (Datadog APM)

#### Cron/Deployment
- `CRON_SECRET` (Vercel cron auth)
- `NEXT_PUBLIC_APP_URL` (default: `http://localhost:3003`)

#### Cross-App Communication
- `WABBIT_RE_URL` (default: `http://localhost:3000`)
- `GSREALTY_URL` (default: `http://localhost:3004`)
- `WABBIT_URL` (default: `http://localhost:3002`)

### Supabase Tables (from migrations)

1. `productivity_form_submissions` — Productivity tracking
2. `tile_settings` — User tile preferences
3. `inbody_scans` — Body composition data
4. `connection_health_cache` — API health status cache
5. `lifx_schedule_state` + `lifx_schedule_config` — Smart light automation
6. `user_integrations` — OAuth tokens (Google, WHOOP, etc.)
7. `contact_tiers` — Contact tier system
8. `mfp_*` tables — MyFitnessPal nutrition data
9. `evening_checkin_submissions` — Evening form data
10. `morning_checkin_submissions` — Morning form data

### Third-Party Integrations

| Service | Files | Purpose |
|---------|-------|---------|
| Notion | `lib/notion/{habits,tasks,inbody}.ts` | Habits tracking, task list |
| GitHub | `lib/github/client.ts` | Commit counts, repo listing |
| Google Gmail | `lib/integrations/google/gmail-client.ts` | Sent email count |
| Google OAuth | `app/api/auth/google/*` | Authentication |
| WHOOP | `lib/whoop/client.ts` | Health/fitness metrics |
| LIFX | `lib/lifx/client.ts` | Smart light control |
| MyFitnessPal | `lib/myfitnesspal/client.ts` | Nutrition tracking |
| Twitter | `lib/twitter/client.ts` | Social stats |
| YouTube | `lib/youtube/client.ts` | Video stats |
| Twilio | `lib/notifications/twilio.ts` | SMS alerts |
| Slack | `lib/notifications/slack.ts` | Webhook notifications |
| Retell AI | `lib/voice/providers/retell/*` | Voice AI agents |
| Brother Printer | `lib/printer/client.ts` | Print jobs over IPP |
| InBody | `lib/inbody/client.ts` | Body composition scans |

### Hardcoded Personal Data to Remove

| File | Issue |
|------|-------|
| `apple-contacts-12.25.25.vcf` | 243KB of personal contacts |
| `ngrok_recovery_codes.txt` | Recovery codes |
| `app/layout.tsx` | `pickleballisapsyop.com` in metadataBase |
| `next.config.js` | Domain reference in comment |
| 6+ component/hook files | `odgsully` GitHub username hardcoded |
| `lib/twitter/client.ts` | `@gsu11y` Twitter handle |
| `scheduler/launchd/*.plist` | `/Users/garrettsullivan/...` hardcoded paths |

---

## The Extraction Process

```bash
# 1. Clone fresh
git clone <monorepo-url> gs-dashboard-public
cd gs-dashboard-public

# 2. Extract gs-site with full commit history
git filter-repo --path apps/gs-site --path-rename apps/gs-site:

# 3. Push to new public repo
git remote add origin git@github.com:odgsully/gs-dashboard.git
git push -u origin main
```

Then fork that public repo privately for your production deployment.

---

## Keeping Them in Sync

**Direction is always: public → private** (never push private commits upstream)

```bash
# In private fork
git fetch upstream
git merge upstream/main
git push origin main
```

When building a new feature:
1. Build it in the **public repo** first (generic version)
2. Pull into private fork
3. Add personal config on top (env vars, custom tiles, etc.)

If a feature is too personal to open-source (e.g., Brother printer integration), build it only in the private fork.

---

## Sanitization Checklist

### Phase 1: Extract the Repository

- [ ] Install git-filter-repo: `pip install git-filter-repo`
- [ ] Clone monorepo to new directory
- [ ] Run `git filter-repo --path apps/gs-site --path-rename apps/gs-site:`
- [ ] Create new public GitHub repo
- [ ] Push extracted history to new repo

### Phase 2: Clean for Open Source

- [ ] Delete `apple-contacts-12.25.25.vcf`
- [ ] Delete `ngrok_recovery_codes.txt`
- [ ] Replace hardcoded `odgsully` with `GITHUB_USERNAME` env var (6+ files)
- [ ] Replace hardcoded `@gsu11y` with `TWITTER_HANDLE` env var
- [ ] Replace `pickleballisapsyop.com` with `NEXT_PUBLIC_APP_URL` env var
- [ ] Remove or parameterize launchd plist files
- [ ] Create `.env.example` with all 24+ vars (dummy values, required vs optional marked)
- [ ] Update `.gitignore` to block `.env*`, `*.vcf`, personal data
- [ ] Add feature flags for optional integrations (`ENABLE_LIFX`, `ENABLE_WHOOP`, etc.)
- [ ] Create a sensible "starter" tile set separate from the full personal set
- [ ] Remove personal planning docs or move to `/docs/internal/`

### Phase 3: Documentation

- [ ] Write comprehensive `README.md` (screenshots, features, quick start, architecture diagram)
- [ ] Create `CONTRIBUTING.md` (setup, PR process, code style)
- [ ] Add `LICENSE` (MIT recommended)
- [ ] Add `CODE_OF_CONDUCT.md` (Contributor Covenant)
- [ ] Document tile system and how to create custom tiles
- [ ] Document single-tenant architecture
- [ ] Add "Deploy to Vercel" button in README
- [ ] Add deployment guide

### Phase 4: Private Fork Setup

- [ ] Fork the public repo to private account
- [ ] Add `upstream` remote pointing to public repo
- [ ] Add real `.env.local` with actual secrets
- [ ] Configure GitHub Actions secrets for CI/CD
- [ ] Set up environment protection rules

### Phase 5: CI/CD & Polish

- [ ] Add GitHub Actions workflow (build, lint, typecheck on PR)
- [ ] Add status badges to README
- [ ] Create demo instance (optional: deploy to Vercel with demo data)
- [ ] Tag initial release (v1.0.0)
- [ ] Add demo screenshots to `/docs/screenshots/`

---

## Inspiration Projects

- **[Dashy](https://github.com/Lissy93/dashy)** (17k+ stars) — self-hostable dashboard, gold standard for docs
- **[Homepage](https://github.com/gethomepage/homepage)** (19k+ stars) — service dashboard, great YAML config pattern
- **[next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)** (5k+ stars) — closest stack (Next.js + shadcn + TypeScript)

Common thread: clean README with screenshots, dead-simple setup (clone → `.env` → `npm run dev`), clear docs on how to extend.

---

## Bottom Line

The gs-site is surprisingly close to extractable — already decoupled from the monorepo with no shared workspace packages. The main work is sanitization (remove personal data, parameterize usernames/domains) and presentation (README, screenshots, contributing guide). The `git-filter-repo` + public upstream / private fork pattern is the industry standard for this exact scenario.

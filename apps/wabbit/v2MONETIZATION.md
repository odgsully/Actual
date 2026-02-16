# Wabbit — Monetization Strategy (v2)

> **Date:** 2026-02-16
> **Status:** Brainstorm / Planning
> **Model:** Closed SaaS + Open API (Stripe model)
> **Supersedes:** `MONETIZATION.md` (open-core model — archived for reference)

---

## Table of Contents

1. [Product Thesis](#1-product-thesis)
2. [Why Closed (Not Open-Core)](#2-why-closed-not-open-core)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Layer-by-Layer Strategy](#4-layer-by-layer-strategy)
5. [Pricing Model](#5-pricing-model)
6. [Agent-First Onboarding](#6-agent-first-onboarding)
7. [Revenue Streams](#7-revenue-streams)
8. [Defensibility](#8-defensibility)
9. [Launch Strategy](#9-launch-strategy)
10. [When to Revisit Open Source](#10-when-to-revisit-open-source)

---

## 1. Product Thesis

Wabbit is a gesture-driven content ranking tool with async collaboration — human-in-the-loop for AI-generated content. Teams rank generated media to reach consensus via RAVG (Ranked Average).

**Monetization thesis:** Pricing tied to value delivered (time saved, productivity gained). Collaboration depth — not record volume — is the natural upgrade trigger. Compete on product quality, brand positioning, and execution speed. Keep all code proprietary; publish only the API spec.

**Distribution thesis:** Two front doors — humans discover Wabbit organically (web/app store), and AI agents discover Wabbit via MCP/API and onboard humans proactively. The agent channel is a zero-friction acquisition flywheel: agents create value (populated Wabbs), humans experience it for free, limits nudge toward paid tiers.

---

## 2. Why Closed (Not Open-Core)

The v1 strategy recommended open-core (AGPLv3 web app, MIT agent layer). After pressure-testing, **closed SaaS is the stronger play for Wabbit specifically.**

### The Defensibility Problem with Open-Core

Wabbit's core features are not structurally defensible at the code level:

| Feature | Defensible? | Why Not |
|---------|-------------|---------|
| Ranking engine (4 modes) | No | Straightforward to build |
| RAVG calculation | No | Arithmetic formula |
| Folder/sidebar file system | No | Standard UI pattern |
| Collaboration with roles | No | Standard RBAC |
| Super RAVG with weights | No | A formula on top of a formula |
| Branching | No | Git-like concept applied to collections |
| Glassmorphism UI | No | CSS classes |
| SSO / audit logs | No | Table-stakes enterprise checkboxes |

Someone with the open-source repo could fork, repaint, and compete in a weekend. The `/ee` features (SSO, audit logs, custom weights) are the price of admission to sell to enterprises — not proprietary IP.

### Why Open-Core Works for Others but Not Wabbit

| Company | Why Open-Core Works | Wabbit Equivalent? |
|---------|--------------------|--------------------|
| Cal.com | Scheduling is a commodity — moat is ecosystem (app store, embed API) | Wabbit doesn't have an embed ecosystem yet |
| Supabase | Running Postgres at scale is genuinely hard — moat is operational | Wabbit's infra isn't complex enough to be a moat |
| PostHog | Analytics at volume requires serious data pipeline engineering | Wabbit's data model is simple |
| n8n | 400+ integrations built by 609 contributors | Wabbit needs ~15 integrations, buildable in-house |

### What You Keep by Staying Closed

- Nobody forks your product and undercuts you
- Full control of roadmap and pricing without community governance
- Move fast without worrying about breaking changes for self-hosters
- Compete on product quality and brand, which are your actual strengths

---

## 3. Competitive Landscape

### Frame.io (Adobe)

| Plan | Price | Seats | Storage | Key Gates |
|------|-------|-------|---------|-----------|
| Free | $0 | 2 | 2 GB | 2 projects |
| Pro | $15/seat/mo | Up to 5 | 2 TB + 2 TB/added seat | Unlimited projects, branded shares, watermarks |
| Team | $25/seat/mo | Up to 15 | 3 TB + 2 TB/added seat | Restricted projects, internal comments |
| Enterprise | Custom | Custom | Custom | SSO, forensic watermarking, DRM, S3 connect |

**Model:** Per-seat + storage scaling. Closed source, Adobe ecosystem.

### Filestage

| Plan | Price | Seats | Storage | Key Gates |
|------|-------|-------|---------|-----------|
| Free | $0 | 10 included | 2 GB | 1 project, 5 files/mo |
| Starter | $199/mo flat | 10 included | 1 TB | Unlimited projects & files, version comparison |
| Business | $329/mo flat | 10 included | 3 TB | AI reviewers, automations, webhooks, API |
| Enterprise | Custom | 10+ | 10 TB | SSO, audit logs, FDA compliance, data residency |

**Model:** Flat price per tier, NOT per-seat. Reviewers (external) are always unlimited and free.

### Ziflow

| Plan | Price | Users | Storage | Key Gates |
|------|-------|-------|---------|-----------|
| Free | $0 | 2 | 2 GB | 1 workflow stage, 60-day history |
| Standard | $199/mo | 15 | 1 TB | 2 workflow stages, 1 template |
| Pro | $329/mo | 20 | 2 TB | 3 workflow stages |
| Enterprise | Custom | 25+ | 4 TB+ | Unlimited stages/templates, ReviewAI, SSO |

**Model:** Flat tier pricing, unlimited reviewers.

### Key Patterns

1. **Users vs. Reviewers split** — Creators (limited) vs. reviewers (unlimited). For Wabbit: Creators = paid seats, Rankers = free.
2. **Flat tier beats per-seat** — Filestage/Ziflow optimize for review adoption breadth. Wabbit should too — RAVG depends on team participation.
3. **Gates are features, not volume** — Upgrade triggers are workflow complexity, security/compliance, API access, and branding.
4. **Price anchoring** — Market established $199-329/mo for team review tools. Wabbit can undercut at $149/mo.
5. **Mobile is universal** — None of the comps gate mobile behind premium tiers. Mobile is distribution, not revenue.

---

## 4. Layer-by-Layer Strategy

All layers are proprietary. The only open element is the published API specification. iOS is available at all tiers as a distribution channel, not a revenue gate.

```
┌─────────────────────────────────────────────────┐
│  Layer 4: Integrations (Slack, Figma, Notion)   │  Proprietary, tiered by plan
├─────────────────────────────────────────────────┤
│  Layer 3: Agent (MCP server + OpenClaw)         │  Closed pkg (free npm), open API spec
├─────────────────────────────────────────────────┤
│  Layer 2: Mobile (iOS gesture-driven ranking)   │  Proprietary, free at all tiers
├─────────────────────────────────────────────────┤
│  Layer 1: Web App (Vite + React + Supabase)     │  Proprietary closed SaaS
├─────────────────────────────────────────────────┤
│  API: REST + WebSocket                          │  Open spec (OpenAPI/Swagger docs)
└─────────────────────────────────────────────────┘
```

### Layer 1: Web App — Closed SaaS

All application code is proprietary. Features are gated by subscription tier, not by open/closed split. The web dashboard is where creators manage — create Wabbs, configure RAVG, manage teams, analyze leaderboards. This is where tier value lives.

| Free Tier | Pro ($29/mo) | Team ($149/mo) | Business ($299/mo) |
|-----------|-------------|----------------|-------------------|
| All 4 ranking modes | All Free features | All Pro features | All Team features |
| Simple RAVG (mean) | + 2 RAVG formulas | + Full custom RAVG | + White-label branding |
| 1 creator | 3 creators | 10 creators | 25 creators |
| Unlimited rankers | Unlimited rankers | Unlimited rankers | Unlimited rankers |
| Upload + webhook | + Zapier, Drive | + Super RAVG + weights | + SSO / SAML |
| 3 active Wabbs | Unlimited Wabbs | + Branching config | + Audit logs |
| 2 GB storage | 50 GB storage | + Windows (sprint periods) | 2 TB, unlimited API |
| 100 API calls/day | 1K API calls/day | 500 GB, 10K API/day | + Branch templates |

### Layer 2: Mobile (iOS) — Distribution Channel, Not Revenue Gate

The iOS gesture system is Wabbit's most defensible product feature. CoreHaptics ranking, tap-drag scoring, 4corners swiping — this is craftsmanship that's hard to replicate.

**iOS is free at all tiers.** The rationale:

- **The best feature should be experienced by the most people.** Gating iOS behind $149/mo means most users never experience the product's strongest differentiator. They judge Wabbit entirely on the web experience.
- **Word of mouth depends on reach.** "You should try Wabbit, the mobile ranking is incredible" doesn't happen if only Team+ subscribers have it.
- **Mobile is the viral loop.** Someone gets invited to rank, downloads the app, loves the gestures, tells others. Gating this kills the network effect before it starts.
- **Rankers need mobile.** If unlimited rankers is the moat, those rankers need to rank from their phones. Charging $149/mo for that undermines the core value prop.
- **The money is in administration, not consumption.** Mobile = ranking (consumption). Web = creating Wabbs, configuring RAVG, managing teams (administration). Tiers gate the administration layer, not the consumption layer.

**What's free on iOS (all tiers):**
- Full ranking experience (all modes the user's tier supports)
- Push notifications for new Wabbs
- Magic link deep linking (one tap to start ranking)
- Ranking history

**What's enhanced at higher tiers on iOS:**
- Pro: 2-axis mode on mobile, all 4 ranking modes
- Team: team presence indicators, real-time collaboration status

**Competitive validation:** Frame.io, Filestage, Ziflow, Figma, Notion, Spotify — none gate mobile app access behind premium tiers. Access to the surface is free; power on that surface is gated.

### Layer 3: Agent — Closed Package, Open API Spec

This is the Stripe model: proprietary SDK, excellent public documentation. No code is exposed. **The agent layer is also a primary distribution channel** — agents proactively onboard humans into Wabbit (see [Section 6](#6-agent-first-onboarding)).

**What you publish openly:**
- OpenAPI/Swagger spec for the full Wabbit REST API
- WebSocket event schemas for Realtime
- API authentication guide (API keys, OAuth)
- Webhook event schemas (record created, ranking submitted, window closed)
- Integration guides
- Suggested agent message templates (so agents present Wabbit consistently)

**What stays closed:**
- MCP server source code (distributed as proprietary npm package, free to use)
- OpenClaw skills source code
- All Edge Functions / server logic
- Supabase schema, RLS policies, triggers
- RAVG engine implementation

**How agents connect:**
```
AI Agent → MCP Server (closed npm pkg) → Wabbit API (hosted) → Supabase
                                              ↑
                                     Rate limiting, metering,
                                     API key auth, analytics
```

All agent traffic routes through the hosted Wabbit API. This gives you:
- Built-in metering (all calls are counted at the gateway)
- No code exposure (MCP server is a thin API client wrapper)
- Full control over rate limiting and billing
- Agent observability dashboard (Team+ feature)

If someone wants to build their own MCP server from the published API spec, they can — it still drives traffic to your platform. Like how anyone can build a Stripe client, but they're still using Stripe.

**MCP Tool Design — High-Level + Granular:**

The MCP server provides opinionated high-level tools (what agents use 90% of the time) alongside granular CRUD tools:

| Tool | Level | Purpose |
|------|-------|---------|
| `wabbit_launch_ranking` | High | One-call: provision user if needed, create Wabb, populate records, return magic link |
| `wabbit_get_results` | High | Poll or webhook for completed rankings, return sorted leaderboard |
| `wabbit_quick_poll` | High | Binary yes/no on small set (< 10 records), even faster |
| `wabbit_create_wabb` | Granular | Create a collection |
| `wabbit_add_records` | Granular | Add records to existing Wabb |
| `wabbit_get_wabb` | Granular | Full Wabb details + records |
| `wabbit_get_leaderboard` | Granular | Read leaderboard for a Wabb |
| `wabbit_submit_ranking` | Granular | Submit a ranking (agent ranks on behalf of user) |
| `wabbit_get_progress` | Granular | Check ranking progress |
| `wabbit_search_wabbs` | Granular | Search user's Wabbs |

The high-level tools are what make agents *choose* Wabbit over "just ask the human to pick from a numbered list." One call and a magic link vs. 5 calls and an account creation flow.

### Layer 4: Integrations — All Proprietary, Tiered by Plan

| All Tiers | Team+ ($149/mo) | Business ($299/mo) |
|-----------|-----------------|-------------------|
| Manual upload | Slack interactive ranking | Social Media Scheduler |
| Webhook ingest | Figma asset sync | Adobe CC plugin |
| Google Drive import | Notion auto-docs | Shopify product push |
| Zapier (basic triggers) | | |

Base inbound integrations (upload, webhook, Drive) are free to get records into the system. Outbound/workflow integrations are where teams get multiplicative value and where the tier gate is.

---

## 5. Pricing Model

### Flat Tier + Unlimited Rankers

| | **Free** | **Pro** | **Team** | **Business** |
|---|---|---|---|---|
| **Price** | $0 | $29/mo flat | $149/mo flat | $299/mo flat |
| **Creators** | 1 | 3 | 10 | 25 |
| **Rankers** | Unlimited | Unlimited | Unlimited | Unlimited |
| **iOS App** | Yes (1-axis + binary) | Yes (all 4 modes) | Yes (+ team presence) | Yes |
| **Active Wabbs** | 3 | Unlimited | Unlimited | Unlimited |
| **Ranking Modes** | 1-axis + binary | All 4 | All 4 + quaternary label customization | All 4 |
| **RAVG** | Simple mean | + weighted + exclude outliers | + Full custom + Super RAVG + member weights | Full + cross-Wabb analytics |
| **Agent Access** | Read-only | Full CRUD (agents can create Wabbs for you) | + Batch ops + webhook subscriptions | + Unlimited + custom rate limits |
| **API Calls** | 100/day | 1K/day | 10K/day | Unlimited |
| **Integrations** | Upload + webhook | + Zapier, Drive | + Slack, Figma, Notion | + Adobe, Shopify, Social |
| **Storage** | 2 GB | 50 GB | 500 GB | 2 TB |
| **Branching** | No | Basic (fresh start) | Full carry-over config | Full + templates |
| **Windows** | No | No | Yes (sprint-based periods) | Yes |
| **SSO/SAML** | No | No | No | Yes |
| **Audit Logs** | No | No | No | Yes |
| **Agent Analytics** | No | No | Yes (observability dashboard) | Yes |
| **White-label** | No | No | No | Yes |

### What Each Tier Upgrade Unlocks

**Free → Pro ($29/mo) — "I want agents to work for me"**
- Pro is the tier where agents can create Wabbs on your behalf. On Free, agents can only read results.
- Unlimited active Wabbs (Free caps at 3)
- All 4 ranking modes on web and mobile
- 2 additional RAVG formulas (weighted, exclude outliers)
- Basic branching
- 10x API call limit (1K/day vs 100)

**Pro → Team ($149/mo) — "My team runs rankings as a workflow"**
- Super RAVG — owner's score applied on top of team consensus with separate weight. The "creative director layer."
- Custom RAVG member weights — not all rankers are equal. Senior designer's rank carries more than an intern's.
- Windows — sprint-based ranking periods that lock and reopen. Structured creative cycles, not ad-hoc.
- Slack interactive ranking — rankers don't open the app, they rank in Slack. 30% participation → 90%.
- Figma/Notion integrations — records flow in from design tools, results auto-doc to Notion.
- Agent observability — when multiple agents create Wabbs for your team, see what's happening.
- 10 creators (vs 3), 500 GB (vs 50), 10K API/day (vs 1K)

**Team → Business ($299/mo) — "Enterprise compliance and scale"**
- SSO/SAML — required for enterprise IT procurement
- Audit logs — full activity trail for compliance
- White-label branding — custom logo, colors, domain
- Branch templates — save and reuse branch configurations across projects
- Unlimited API, 2 TB storage, 25 creators
- Adobe CC, Shopify, social media integrations

### Overages

- **Storage:** $10/100 GB beyond tier limit
- **API calls:** Per-call pricing beyond tier (pricing TBD based on usage data)

### Why Flat Tier (Not Per-Seat)

- RAVG value prop depends on team participation — charging per-ranker undermines the core mechanic
- Filestage and Ziflow validate this model at $199-329/mo
- Flat pricing reduces friction, accelerates team adoption
- Unlimited rankers at every tier is the moat

### Why Not Per-Seat

- Frame.io can charge per-seat because it's embedded in Adobe's ecosystem
- Wabbit doesn't have that distribution yet — friction kills adoption for new products
- Per-seat penalizes the behavior you want (more team members ranking)

### Why Not Pure Usage-Based

- Scary for marketing teams with budgets — they need predictable costs
- Penalizes adoption (you want people ranking more, not less)
- Works for infra (Supabase, PostHog) but not for workflow/collaboration tools

---

## 6. Agent-First Onboarding

### The Two Front Doors

Wabbit has two acquisition channels that coexist:

**Front Door 1: Human-led** — Person discovers Wabbit, downloads app or hits web, creates account, invites team. Traditional SaaS PLG.

**Front Door 2: Agent-led** — An AI agent (Claude, GPT, custom) is helping a human with a creative task. Agent discovers Wabbit via MCP tool registry or API docs, thinks "my human needs ranked consensus on these generated images," creates a Wabb, populates it with records, and tells the human it's ready. The human taps a magic link and starts ranking. They never visited a marketing page. They never "signed up."

### Proactive Agent Flow

Agents act proactively — they don't ask permission, they create value and let the human know.

**Step 1: Agent encounters a ranking need**
User says: "I generated 40 hero images for the landing page, help me pick the best 5."

**Step 2: Agent calls `wabbit_launch_ranking` (one API call)**
```json
{
  "human_email": "garrett@company.com",
  "wabb_name": "Landing Page Heroes — Round 1",
  "records": [
    { "url": "https://...", "label": "Option A - Bold" },
    { "url": "https://...", "label": "Option B - Minimal" }
  ],
  "ranking_mode": "one_axis",
  "message": "Rank these by visual impact. Top 5 go to production."
}
```

Wabbit handles everything behind the scenes:
- If user exists → creates Wabb in their workspace
- If user doesn't exist → provisions a Free account, creates Wabb
- Generates a magic link with embedded auth
- Returns the link to the agent

**Step 3: Agent responds to human**
```json
{
  "wabb_id": "abc123",
  "magic_link": "https://wabbit.app/r/x7k9m2",
  "records_count": 40,
  "estimated_rank_time": "4 min",
  "suggested_message": "I put together a ranking session for your 40 hero images..."
}
```

The API response includes a `suggested_message` template so agents present Wabbit consistently:

> "I put together a ranking session for your 40 hero images. Tap through and rank them by visual impact — takes about 4 minutes. I'll grab your top picks when you're done.
>
> **[Rank Now →](https://wabbit.app/r/x7k9m2)**"

No explanation of what Wabbit is. No feature pitch. Just "here's a thing to do, it'll take 4 minutes, I'll use the results."

**Step 4: Human taps the magic link**
- If iOS app installed → Universal Link deep links straight into the Wabb, record #1 ready to rank
- If no app → mobile web opens with full ranking experience (minus haptics)
- No onboarding screens. No "welcome to Wabbit." No tutorial.
- The agent's `message` ("Rank these by visual impact. Top 5 go to production.") is displayed as context, then fades.
- They swipe through 40 records. Progress dots show how far. Done in 3-5 minutes.

**Step 5: Agent retrieves results**
Webhook fires or agent polls:
```
wabbit_get_results(wabb_id: "abc123")
→ { top_5: [...], ravg_scores: [...] }
```

Agent says: "Based on your rankings, here are the top 5 hero images. Want me to resize them for the landing page?"

### The Magic Link

The link does heavy lifting:

1. **Auths the user** — no login screen, no password, no OAuth redirect. One tap.
2. **Deep links to the specific Wabb** — straight to record #1, not a dashboard.
3. **Works on both iOS app and mobile web** — Universal Link with web fallback.
4. **Expires gracefully** — 7-30 days. If expired: "This link expired. Open Wabbit to find your Wabb."
5. **Is short and clean** — `wabbit.app/r/x7k9m2` not a tracking URL mess.

### The Invisible Account

What happened behind the scenes that the human never saw:
- A Free account was created tied to their email
- The magic link contained a short-lived JWT that auto-authenticated them
- Their rankings were stored, synced to the Wabb's RAVG
- A webhook fired back to the agent: "ranking complete"

The human now has a Wabbit account with one Wabb and their ranking history. If an agent sends them another magic link next week, it hits the same account. Rankings accumulate. History builds.

**That's** when they might open the app on their own. Browse past Wabbs. See ranking patterns. They discover they're a Wabbit user — not because they signed up, but because value accumulated silently.

### The App Install Moment

If the human doesn't have iOS app and gets a magic link:
- Mobile web handles it — full ranking experience works fine
- After ranking, a single non-intrusive suggestion: "Want the full gesture experience? Get the app." with App Store link
- Not a blocker, not a modal — a suggestion after they've gotten value
- Once installed, the app recognizes the account from the magic link token — no "sign up" prompt

### How Limits Hit Naturally

The Free tier doesn't feel like a "free tier" because the human never chose it. Limits only surface at the moment of need:

- **3 active Wabbs:** Agent tries to create a 4th → API returns `{ upgrade_required: true, reason: "wabb_limit" }`. Agent tells human: "You've got 3 active ranking sessions. Want to close one, or I can set up Pro ($29/mo) for unlimited?"
- **100 API calls/day:** Agent hits rate limit → same pattern. "I'm hitting the daily limit on your Wabbit account."
- **Agent CRUD blocked on Free:** Agents can read results on Free, but full create/populate requires Pro. This is the key upgrade trigger — "Want me to keep setting up ranking sessions for you? That's $29/mo."

The human never sees a pricing page unless the agent surfaces it in context. And even then, the agent frames it as "here's why" not "here's a paywall."

### Agent as Free Sales Rep

The agent channel flips traditional SaaS distribution:

| Traditional SaaS | Wabbit Agent Channel |
|-------------------|---------------------|
| Human finds product | Agent finds product |
| Human evaluates features | Agent evaluates API quality |
| Human signs up | Agent provisions account |
| Human creates first project | Agent creates first Wabb |
| Human invites team | Agent sends magic link |
| Human hits paywall | Agent explains upgrade at moment of need |

The API being excellent isn't a cost center — it's a distribution channel. Every agent that integrates Wabbit is an unpaid sales rep creating value that drives upgrades.

---

## 7. Revenue Streams

### Primary (Launch)

1. **Cloud subscriptions** — Predictable MRR from Pro/Team/Business tiers
2. **Storage overages** — Video and 3D heavy teams ($10/100 GB)

### Secondary (Phase 2+)

3. **API metering** — Call overages beyond tier limits
4. **Agency white-label** — $500-2,000/mo base for custom branding + embed licensing
5. **Agency partnerships** — Volume discounts, platform fee on client billing

### Tertiary (Phase 4+)

6. **Template Marketplace** — 15-20% platform fee on template sales ("Crowd Coffees")
7. **Integration premium** — Advanced integrations as upgrade trigger

### On Crowd Coffees / Crypto Marketplace

Start with Stripe for template marketplace. Add crypto/Base integration later. None of the comps have marketplace revenue yet — you'd be ahead of the curve. Don't let crypto block launch. The community content itself becomes the moat — can't fork a community.

---

## 8. Defensibility

### What's Actually Defensible (Not Code)

| Moat | Type | Timeline |
|------|------|----------|
| **Execution speed** | First to market with purpose-built HIL ranking for AI content | Now |
| **Brand positioning** | "The human-in-the-loop layer for AI content" — own the narrative | Now |
| **iOS gesture craftsmanship** | CoreHaptics tuning, tap-drag UX — hard to replicate from specs | Phase 2 |
| **Agent distribution** | First MCP-native ranking tool — agents default to Wabbit | Phase 2 |
| **Network effects** | Teams with established RAVG histories don't switch — data doesn't port | 6-12 months |
| **Integration depth** | Deep Slack/Figma/Notion integrations that "just work" — first-mover quality | Phase 3 |
| **Template marketplace** | Community-created content (Crowd Coffees) — can't fork a community | Phase 4+ |

### What's NOT Defensible

- The ranking engine code (straightforward to rebuild)
- The RAVG formula (it's math)
- The collaboration model (standard RBAC)
- The UI design (CSS is not a moat)
- Enterprise features like SSO/audit logs (table stakes)

### Implication

The moat is **moving fast, building brand, accumulating network effects, and owning the agent channel** — not protecting code. Staying closed prevents easy forking while you build the real moats. Open-sourcing would give away the one thing you can control (code) in exchange for distribution you can achieve through PLG, agent onboarding, and marketing.

---

## 9. Launch Strategy

### Phase Sequence

1. **Launch free tier** — Get 1,000 B2EC users ranking content, validate the core loop
2. **Ship MCP server + `wabbit_launch_ranking`** — Proprietary npm package (free to use), excellent API docs. One-call Wabb creation with magic link. Get into the AI agent ecosystem early
3. **iOS app (free at all tiers)** — The viral distribution play. Every ranker becomes a potential advocate
4. **Introduce Pro at $29/mo** — Agent CRUD unlock, unlimited Wabbs, all ranking modes, generous storage
5. **Add Team tier at $149/mo** — When collaboration features (Wave 4) are solid. Super RAVG, windows, Slack integration
6. **Business tier at $299/mo** — When SSO/audit log demand materializes from enterprise prospects
7. **Agency white-label** — When agencies start asking to embed ($500-2K/mo base)
8. **Template marketplace** — Phase 4, after community is creating content

### The Dual Flywheel

**Human-Led Flywheel:**
```
Free tier (web/iOS) → Solo user ranks content → Invites team → Team needs RAVG depth
→ Pro $29/mo → Needs Super RAVG + collab workflow → Team $149/mo
→ Enterprise needs SSO → Business $299/mo → Agency wants embed → White-label
```

**Agent-Led Flywheel:**
```
Agent discovers MCP tool → Creates Wabb + magic link → Human ranks (free, seamless)
→ Agent retrieves results → Agent uses Wabbit again → More Wabbs created
→ Human accumulates history → Opens app organically → Hits Free limits
→ Upgrades to Pro ($29) → Agent gets full CRUD → Creates more value
→ Human invites team → Team tier ($149)
```

The two flywheels feed each other. Agent-onboarded users who love the experience invite teammates (human flywheel). Human users whose agents start using the API discover they need Pro for agent CRUD (agent flywheel).

### Key Metrics to Track

| Metric | Why It Matters |
|--------|---------------|
| **Agent-sourced accounts** | % of new accounts created via `wabbit_launch_ranking` vs. organic signup |
| **Magic link → rank completion rate** | Are humans actually ranking after the agent sets it up? |
| **Free → Pro conversion rate (agent path)** | Does agent CRUD gating drive upgrades? |
| **Free → Pro conversion rate (human path)** | Does Wabb limit / ranking mode gating drive upgrades? |
| **Ranker-to-creator conversion** | % of invited rankers who later create their own Wabbs |
| **Agent retention** | Do agents keep using Wabbit after first call, or is it one-and-done? |

---

## 10. When to Revisit Open Source

Open-core becomes worth reconsidering if any of these become true:

| Trigger | Why It Changes Things |
|---------|----------------------|
| **You want to build a developer platform** | If Wabbit evolves into embeddable infrastructure (like Cal.com's scheduling atoms), open-core helps adoption |
| **A well-funded competitor appears** | Open-sourcing becomes a competitive weapon ("we're transparent, they're not"). Classic defensive move |
| **You need community contributions at scale** | If you need 400+ integrations like n8n, you can't build them all in-house |
| **You're raising and need GitHub stars for signal** | VCs look at stars. Open-sourcing can boost a fundraise narrative |
| **The product becomes infrastructure** | If other companies want to build on top of Wabbit (not just use it), open-core enables that ecosystem |

None of these apply at Wabbit's current stage. The decision is reversible — you can always open-source later. You can never close-source after opening.

---

## Open-Core Research (Archived Reference)

The v1 analysis (`MONETIZATION.md`) contains detailed research on open-core business models including Cal.com, PostHog, Langfuse, Supabase, n8n, Dify, Plane, and AppFlowy. Key findings preserved here for reference:

- **The `/ee` directory pattern** is the industry standard for open-core (MIT/AGPL core, proprietary enterprise features)
- **Compliance features** (SSO, SAML, audit logs) are the safest paywall across all open-core companies
- **AI credits** are emerging as a separate metered revenue line (Plane, AppFlowy, Dify)
- **MCP/agent monetization is still early** — nobody charges for MCP servers directly
- **Mobile is distribution, not revenue** — no open-core company charges separately for mobile
- **Managed hosting is where the money is** — even when the code is free, most users pay for convenience

These patterns informed the closed-model strategy: we adopt the same revenue levers (tiered subscriptions, compliance paywalls, metered API) without the code exposure risk.

---

## References

- [Frame.io Pricing](https://frame.io/pricing)
- [Filestage Pricing](https://filestage.io/pricing/)
- [Ziflow Pricing](https://www.ziflow.com/pricing)
- `MONETIZATION.md` — v1 open-core analysis (archived)
- `ref/diagrams/monetization.svg` — Visual architecture diagram (closed model)
- Cal.com, PostHog, Langfuse, Supabase, n8n, Dify, Plane, AppFlowy — open-core model analysis (Feb 2026)

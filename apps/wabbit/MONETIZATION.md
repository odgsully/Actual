> **Status:** Archived. This document outlines an open-core model. For the current closed SaaS strategy, see [`v2MONETIZATION.md`](./v2MONETIZATION.md).

# Wabbit — Monetization Strategy

> **Date:** 2026-02-15
> **Status:** Brainstorm / Planning
> **Context:** Open-core model with productized cloud layer, analyzed through all four architecture layers

---

## Table of Contents

1. [Product Thesis](#1-product-thesis)
2. [Competitive Landscape (Review/Approval Tools)](#2-competitive-landscape)
3. [Open Source Business Model Research](#3-open-source-business-model-research)
4. [Layer-by-Layer Monetization Strategy](#4-layer-by-layer-monetization-strategy)
5. [Pricing Model](#5-pricing-model)
6. [Revenue Streams](#6-revenue-streams)
7. [Open Source Tradeoffs](#7-open-source-tradeoffs)
8. [Market Positioning](#8-market-positioning)

---

## 1. Product Thesis

Wabbit is a gesture-driven content ranking tool with async collaboration — human-in-the-loop for AI-generated content. Teams rank generated media to reach consensus via RAVG (Ranked Average).

**Monetization thesis:** Pricing should be tied to value delivered (time saved, productivity gained). The collaboration depth — not record volume — is the natural upgrade trigger. The open-source core drives distribution; the managed cloud and premium features drive revenue.

---

## 2. Competitive Landscape

### Frame.io (Adobe)

| Plan | Price | Seats | Storage | Key Gates |
|------|-------|-------|---------|-----------|
| Free | $0 | 2 | 2 GB | 2 projects |
| Pro | $15/seat/mo | Up to 5 | 2 TB + 2 TB/added seat | Unlimited projects, branded shares, watermarks |
| Team | $25/seat/mo | Up to 15 | 3 TB + 2 TB/added seat | Restricted projects, internal comments |
| Enterprise | Custom | Custom | Custom | SSO, forensic watermarking, DRM, S3 connect |

**Model:** Per-seat + storage scaling. Every added seat comes with 2 TB. Closed source, Adobe ecosystem.

### Filestage

| Plan | Price | Seats | Storage | Key Gates |
|------|-------|-------|---------|-----------|
| Free | $0 | 10 included | 2 GB | 1 project, 5 files/mo |
| Starter | $199/mo flat | 10 included | 1 TB | Unlimited projects & files, version comparison |
| Business | $329/mo flat | 10 included | 3 TB | AI reviewers, automations, webhooks, API |
| Enterprise | Custom | 10+ | 10 TB | SSO, audit logs, FDA compliance, data residency |

**Model:** Flat price per tier, NOT per-seat. All plans start with 10 team members. Additional seats in bundles of 5 (each bundle adds 1 TB storage). Reviewers (external) are always unlimited and free.

### Ziflow

| Plan | Price | Users | Storage | Key Gates |
|------|-------|-------|---------|-----------|
| Free | $0 | 2 | 2 GB | 1 workflow stage, 60-day history |
| Standard | $199/mo | 15 | 1 TB | 2 workflow stages, 1 template |
| Pro | $329/mo | 20 | 2 TB | 3 workflow stages |
| Enterprise | Custom | 25+ | 4 TB+ | Unlimited stages/templates, ReviewAI, SSO |

**Model:** Flat tier pricing, unlimited reviewers. Users (who create/manage) are capped; reviewers (who give feedback) are unlimited. Extra users in packs of 5.

### Key Patterns from Comps

1. **Users vs. Reviewers split** — Filestage and Ziflow distinguish creators (limited) from reviewers (unlimited). Directly applicable to Wabbit: Owners/Contributors = paid seats, Viewers/Rankers = free.
2. **Flat tier vs. per-seat** — Frame.io charges per-seat (Adobe ecosystem lock-in). Filestage/Ziflow charge flat (optimizing for review adoption breadth).
3. **Gates are features, not volume** — None gate heavily on file/record volume. Upgrade triggers are workflow complexity, security/compliance, API access, and branding.
4. **Price anchoring** — Market has established $199-329/mo for team review tools.

---

## 3. Open Source Business Model Research

### The `/ee` Directory Pattern (Industry Standard)

Every successful open-core company uses this: core product under an open license, enterprise features in a proprietary `/ee` directory.

| Company | License | GitHub Stars | What's Open | What's Paid (`/ee`) |
|---------|---------|-------------|-------------|---------------------|
| Cal.com | AGPLv3 | 40K | Full scheduling engine, API, integrations | Team features, round-robin, SSO, SCIM, Platform/Atoms (embeddable) |
| PostHog | MIT + `/ee` | 31K | Analytics, session replay, feature flags, A/B testing | SSO, advanced permissions, custom data pipelines |
| Langfuse | MIT + `/ee` | 22K | Full tracing, prompt management, evaluations | SCIM, audit logging, data retention, org management |
| Supabase | Apache 2.0 | 78K | Full Postgres, Auth, Storage, Realtime, Edge Functions | Managed cloud (primary revenue), usage-based overages |
| n8n | Sustainable Use | 175K | Full workflow engine, 400+ integrations | Cloud hosting, SSO, LDAP, air-gapped, audit logs |
| Dify | Apache 2.0 (modified) | 130K | Workflow builder, RAG, agents, 50+ tools | Cloud hosting, multi-tenant SaaS restriction |
| Plane | AGPLv3 | 46K | Projects, work items, cycles (up to 12 users) | Integrations marketplace, AI credits, templates, dashboards |
| AppFlowy | AGPLv3 | 68K | Full editor, databases, kanban, desktop apps | Cloud collaboration, AI features (separate add-ons) |

### License Recommendations

| License | Best For | Risk |
|---------|----------|------|
| **MIT** | Maximum adoption, compete on cloud convenience | Zero protection from competitors forking |
| **AGPLv3** | Preventing cloud competitors, forcing commercial license for embeds | Scares some enterprise legal teams |
| **Apache 2.0** | Permissive but with brand protection | AWS can host your product without contributing |
| **Sustainable Use / Fair Code** | Blocking commercial redistribution | Not OSI-approved, community backlash |
| **BSL** | Converts to open after delay | Declining after HashiCorp backlash |

**Recommendation for Wabbit: AGPLv3** — Prevents competitors from hosting Wabbit without open-sourcing their modifications. Forces agencies/companies wanting to embed or white-label Wabbit to buy a commercial license. This is the Cal.com and Plane approach.

### What the Market Proves About Monetization

1. **Compliance features are the safest paywall** — SSO, SAML, audit logs, RBAC. Individual devs don't need them; enterprises with 50+ employees must have them.
2. **AI credits are the new metered revenue line** — Plane, AppFlowy, Dify all meter AI separately from seat pricing.
3. **Don't gate integrations** — Only Plane does it, and they're the smallest. Integrations drive adoption and lock-in.
4. **Mobile is distribution, not revenue** — No open-core company charges separately for mobile access.
5. **Managed hosting is where the money is** — Every company on this list can be self-hosted for free. Every one makes most of its money from people who don't want to deal with infrastructure.
6. **MCP/agent monetization is still early** — Nobody charges for MCP servers directly. The play is adoption and ecosystem positioning.

---

## 4. Layer-by-Layer Monetization Strategy

Wabbit has four distinct layers. The open-source decision is per-layer:

```
┌─────────────────────────────────────────────────┐
│  Layer 4: Integrations (Slack, Figma, Notion)   │  ← Open (drives adoption/lock-in)
├─────────────────────────────────────────────────┤
│  Layer 3: Agent (OpenClaw skills, MCP server)   │  ← Open (ecosystem play)
├─────────────────────────────────────────────────┤
│  Layer 2: Mobile (iOS gesture-driven ranking)   │  ← Closed (proprietary UX moat)
├─────────────────────────────────────────────────┤
│  Layer 1: Web App (Vite + React + Supabase)     │  ← Open-core (core open, ee/ paid)
└─────────────────────────────────────────────────┘
```

### Layer 1: Web App — Open-Core Foundation

| Open (AGPLv3) | Paid (`/ee` proprietary) |
|---|---|
| Core ranking engine (all 4 modes) | Super RAVG + custom weight formulas |
| Single-user Wabbs | Team collaboration (multi-user RAVG) |
| Basic folder/sidebar organization | SSO / SAML |
| Record display (image, text, audio) | Audit logs |
| Simple RAVG (arithmetic mean) | Branching with carry-over config |
| Basic API | White-label / custom branding |
| Self-hostable with Supabase | Advanced analytics / reporting |

### Layer 2: Mobile (iOS) — Keep It Closed

The iOS gesture system is Wabbit's UX moat. CoreHaptics ranking, tap-drag scoring, 4corners swiping — this is differentiated IP that doesn't benefit from being open. Nobody self-hosts an iOS app.

- iOS app is **closed source, proprietary**
- Available only to paid Wabbit Cloud subscribers (Team tier+)
- Free/self-hosted users get the web app only
- Creates natural upgrade path: "Love ranking on web? The iOS experience is 10x faster with haptic feedback"

This follows the pattern of most dev tools: web/backend is open, premium native experience is closed (GitHub CLI = open, GitHub mobile = proprietary).

### Layer 3: Agent Layer (MCP + OpenClaw) — Open It Up

The MCP ecosystem is in its "land grab" phase. Supabase became an official Claude MCP connector for free. Composio gives away their MCP server and charges for managed auth/orchestration.

- **MCP server** (`packages/mcp-server/`) → **MIT license, npm package, fully open**. Every AI agent in the world should be able to rank content through Wabbit. This is a distribution channel.
- **OpenClaw skills** (`packages/openclaw-skills/`) → **MIT license, open**. Same logic.
- **Agent API keys, sessions, events** (Wave 5 tables) → **Managed layer**. Self-hosters manage their own auth/keys. Wabbit Cloud handles agent session management, rate limiting, usage analytics, and key rotation.

Monetization is indirect but powerful:
- Open MCP server → agents create records → records need ranking → ranking on Wabbit Cloud (paid) or self-hosted (free but you run infra)
- Agent usage drives record volume → team engagement → subscription revenue
- Agent analytics and observability (which agents ranked what, optimization suggestions) → Cloud-only feature

### Layer 4: Integrations — Open Core, Gate Premium

| Open (all tiers) | Cloud-only (Team+) |
|---|---|
| Manual record upload | Slack interactive ranking |
| Webhook ingest API | Figma asset sync |
| Basic Zapier triggers | Notion auto-docs |
| Google Drive import/export | Social Media Scheduler |
| | Adobe CC plugin |
| | Shopify product push |

Basic inbound record population (upload, webhook, Drive) should be free to get records into the system. Outbound/workflow integrations (Slack ranking, social scheduling, Shopify push) are where teams get multiplicative value and where the gate is.

---

## 5. Pricing Model

### Recommended: Flat Tier + Unlimited Rankers

| | **Self-Host (AGPL)** | **Cloud Free** | **Cloud Pro** | **Cloud Team** | **Cloud Business** |
|---|---|---|---|---|---|
| **Price** | $0 (run your own infra) | $0 | $29/mo flat | $149/mo flat | $299/mo flat |
| **Web App** | Full core | Full core | Full core | Full core + `/ee` | Full + `/ee` + white-label |
| **Creators** | Unlimited | 1 | 3 | 10 | 25 |
| **Rankers** | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited |
| **Ranking Modes** | All 4 | All 4 | All 4 | All 4 | All 4 |
| **RAVG** | Simple mean only | Simple mean only | Simple mean + 2 formulas | Full custom + Super RAVG + weights | Full custom + Super RAVG + weights |
| **iOS App** | No | No | No | Yes | Yes |
| **MCP Server** | Self-manage | Yes (100 agent calls/day) | Yes (1K/day) | Yes (10K/day) | Yes (unlimited) |
| **Agent Analytics** | No | No | No | Yes | Yes |
| **Integrations** | Webhook + upload only | Webhook + upload | + Zapier, Drive | + Slack, Figma, Notion | + Adobe, Shopify, Social Scheduler |
| **Storage** | Your infra | 2 GB | 50 GB | 500 GB | 2 TB |
| **Branching** | Basic | Basic | Basic | Full carry-over config | Full + templates |
| **SSO/SAML** | No | No | No | No | Yes |
| **Audit Logs** | No | No | No | No | Yes |

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

## 6. Revenue Streams

### Primary (Launch)

1. **Cloud subscriptions** — Predictable MRR from Pro/Team/Business tiers
2. **Storage overages** — Video and 3D heavy teams ($10/100 GB)
3. **Commercial licenses** — Agencies embedding Wabbit via AGPL commercial license

### Secondary (Phase 2+)

4. **iOS app access** — Bundled with Team+ tier (drives upgrades)
5. **Agent metering** — MCP call overages beyond tier limits
6. **Agency partnerships** — Volume discounts on seats, platform fee on client billing

### Tertiary (Phase 4+)

7. **Template Marketplace** — 15-20% platform fee on template sales ("Crowd Coffees")
8. **White-label** — $500-2,000/mo base + per-seat for enterprise custom branding
9. **Integration premium** — Advanced integrations as upgrade trigger

### On Crowd Coffees / Crypto Marketplace

Start with Stripe for template marketplace. Add crypto/Base integration later. None of the comps have marketplace revenue yet — you'd be ahead of the curve. Don't let crypto block launch.

---

## 7. Open Source Tradeoffs

### What You Gain

| Benefit | Evidence |
|---|---|
| Distribution / awareness | PostHog 31K stars, Supabase 78K stars vs. Frame.io 0 (closed) |
| Bottom-up PLG adoption | Engineer self-hosts → loves it → pitches to team → Cloud Team $149/mo |
| Community contributions | n8n: 609 contributors, 400+ integrations. Impossible with a closed team |
| Lower price points, higher volume | Community contributes features, self-hosters offset infra costs |
| AGPL commercial license revenue | Agencies embedding Wabbit pay for commercial license (Cal.com Platform/Atoms model) |
| Credibility in 2026 | Open-source is trust signal, not weakness |

### What You Risk

| Risk | Mitigation |
|---|---|
| Competitors fork your core | AGPL prevents commercial forks without open-sourcing. Enterprise features stay in `/ee` (proprietary) |
| Self-hosters never convert to paid | Operational burden of Supabase + storage + auth is real. Most teams pay for Cloud. Supabase proves this |
| iOS app gets reverse-engineered | Keep it closed source. Gesture UX is proprietary moat |
| Feature request overload from community | Maintain clear roadmap. The `/ee` split gives cover: "that's an enterprise feature" |
| "Free tool" perception | PostHog, Supabase, Cal.com have killed this stigma |

---

## 8. Market Positioning

### How Open Source Reframes the Competitive Landscape

**Frame.io** is fully closed, owned by Adobe. Every user is paying or on a capped free tier. High revenue per user, limited distribution.

**Filestage and Ziflow** are also fully closed. Same dynamic.

**Wabbit with open-core** plays a fundamentally different game:

1. **Distribution advantage** — Self-hosters and OSS enthusiasts become your marketing army
2. **Bottom-up adoption** — Content production engineers self-host for personal AI workflow → pitch to team → Cloud subscription
3. **Community moat** — Community integrations, ranking modes, display features make the product better without paying for all engineering
4. **Competitive pricing** — Undercut Filestage/Ziflow ($199-329/mo) because community contributions offset engineering costs
5. **AGPL commercial license** — Revenue stream that closed-source competitors simply don't have

### The Strategic Question

The question isn't whether to go open — it's whether to compete with Frame.io on their terms (closed, per-seat, Adobe distribution) or on yours (open ecosystem, community-driven, agent-native).

Given Wabbit's thesis — "human-in-the-loop for AI content" — leaning into the open/agent-native positioning is the stronger play. The MCP server as an open distribution channel, the web app as an open-core community product, and the iOS gesture experience + enterprise collaboration features as the proprietary premium layer.

---

## Launch Strategy

1. **Launch free** — Get 1,000 B2EC users ranking content, validate the core loop
2. **Open-source the web core** — AGPLv3, build GitHub community, drive awareness
3. **Ship MCP server** — MIT, npm package, get into the AI agent ecosystem early
4. **Introduce Pro at $29/mo** — All ranking modes, unlimited Wabbs, generous limits
5. **Add Team tier at $149/mo** — When collaboration features (Wave 4) are solid
6. **iOS app as Team perk** — Drive upgrades with the premium native experience
7. **Template marketplace** — Phase 4, after community is creating content
8. **Commercial licensing** — When agencies start asking to embed (AGPL forces the conversation)

---

## References

- [Frame.io Pricing](https://frame.io/pricing)
- [Filestage Pricing](https://filestage.io/pricing/)
- [Ziflow Pricing](https://www.ziflow.com/pricing)
- Cal.com, PostHog, Langfuse, Supabase, n8n, Dify, Plane, AppFlowy — open-core model analysis (Feb 2026)

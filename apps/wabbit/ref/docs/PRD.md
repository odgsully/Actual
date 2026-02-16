# Wabbit - Product Requirements Document

> **Source:** Notion "Wabbit Build!" workspace, Business Plan, Features DB, Integrations, GS Wabbs, and Opus4.6 architecture prototype.
> **Last synced:** 2026-02-12

---

## 1. Product Overview

**Wabbit** is a gesture-driven ranking/scoring tool with async collaboration, designed for teams producing AI-generated content (AIGC). It provides a human-in-the-loop (HIL) process for ranking, reviewing, and approving content at scale across web, mobile, and Slack.

### One-Liner

> A team-oriented content ranking system that connects to content generation APIs, populates records on a timer, and lets individuals or teams score content to reach consensus on quality via a weighted Ranked Average (RAVG).

### Thesis

There is a better human-in-the-loop process for high-ROI generative content. Quality via Quantity. Get better media generations by parsing through more datapoints in less time (indiv and/or team cohesiveness), all the while giving more context to your agentic layer.
When content is customer-facing, skipping team review is a risk too costly for the business impact. Wabbit threads the needle between AI content generation speed and team quality consensus. 

---

## 2. Problem Statement

- **Over-adoption risk:** Teams removing humans from the loop to quote cost savings, but customer-facing content demands quality control and review to ensure taste.
- **Under-adoption risk:** Teams not leveraging AI generation at all, missing volume/variety benefits.
- **No central hub:** Marketing teams lack a unified place to poll, rank, review, and schedule AI-generated content across platforms.
- **Feedback fragmentation:** Team polling on content quality is scattered across Slack, email, and ad-hoc tools.

---

## 3. Target Users

| Segment | Description |
|---------|-------------|
| **B2IC** | Business to Intrapreneurial Consumers — tech-first enthusiasts on forward-looking teams at larger corporations |
| **B2EC** | Business to Entrepreneurial Consumers — solopreneurs, small business owners, individual creators |
| **B2B** | Marketing agencies integrating Wabbit into client workflows |
| **Content Creators** | Social media influencers, video creators, digital storytellers |
| **Content Production Engineers** | Agentic engineers running generation pipelines |

---

## 4. Core Concepts & Glossary

| Term | Definition |
|------|-----------|
| **Wabb** | A single project/collection — a set of records to be ranked |
| **Record** | An individual item within a Wabb (image, video, text output, etc.) |
| **Ranking** | A user's score (0.0–10.0, one decimal) for a given record |
| **RAVG** | Ranked Average — default: simple arithmetic mean of all ranker scores. Customizable per-Wabb at creation or in Settings: choose from predefined formulas (weighted by role, exclude outliers, etc.) and/or assign granular per-member weight multipliers |
| **Collection** | Synonym for Wabb — the container for records |
| **Collaborator** | A user with access to a Wabb (roles: owner, contributor, viewer) |
| **1-axis / 2-axis / Quaternary / Binary** | Ranking modes — 1-axis = simple 0-10 slider; 2-axis = category-based swiping; Quaternary = 4-option A/B/C/D multiple choice with configurable labels per-Wabb (changing a label triggers a Branch with confirmation prompt); Binary = Yes/No (per-Wabb setting) |
| **Wabb Time Window** | Sprint-based lifecycle for record generation. Optional (can be set to No Expiration). Closing a window locks that sprint; rankings remain visible in subsequent windows |
| **Branched Wabb** | Offshoot of a Wabb when the project evolves past its original outline. Rankings do NOT carry over — always starts fresh. A branching menu with smart defaults lets users select what to bring over (Asset Library and Display Features pre-checked; Team, Context Docs/SOPs, Agent Optimization Level, and Notifications unchecked by default). Changing a Quaternary label also triggers a Branch with user confirmation. |
| **Wabb Proposal** | Request from a Contributor to an Owner for a new or Branched Wabb |
| **Vetted Ref** | Wabb type centered around replicating/recycling aspects of a proven end result |
| **Super RAVG** | RAVG that additionally incorporates the Owner's score at a separate weight. The owner is excluded from the level 1 team RAVG; their score is applied as level 2 with a separately configurable supervisor weight. ("Supervisor" refers to the level 2 weighting concept; in the database this is the collection owner.) |
| **Agent Optimization Level** | Per-Wabb setting: No / Low / Medium (recommended) / High. Controls AI agent autonomy. Phase 1 = UI toggle only |
| **HIL** | Human in the Loop — the core value proposition |
| **HRR** | Hit Record & Roll — spontaneous content creation approach |
| **P2P** | Plan to Perfection — methodical storyboarded content approach |
| **Folder** | User-created organizational container in the sidebar file system. Two-level hierarchy: Folders > Wabbs. Wabbs without a folder appear in an "Unfiled" section |
| **Magic Link** | Short-lived authentication link generated by agents (via `wabbit_launch_ranking`) or the system. Auto-authenticates the user (JWT embedded) and deep links directly to a Wabb. Format: `wabbit.app/r/x7k9m2`. Expires in 7–30 days. Provisions a Free account if user doesn't exist. iOS Universal Link + web fallback. |

---

## 5. Platform Architecture

### 5.1 Layers

| Layer | Tech | Purpose |
|-------|------|---------|
| **Backend + DB** | Supabase (Postgres) | Auth, data, RLS, Edge Functions |
| **Web App** | Vite + React SPA + Tailwind + Zustand | Browser ranking UI (behind auth — no SSR needed) |
| **Landing Page** | Astro (static HTML) | SEO/GEO-optimized marketing page. Pure HTML for AI crawler visibility. React islands for interactive demos. |
| **iOS App** | Swift (SwiftUI + UIKit gestures) | Native gesture-driven ranking |
| **Slack** | Supabase Edge Functions + Slack API | Notifications + interactive ranking |

### 5.2 Web App Layout

Three-column layout inspired by OneNote's file system navigation:

```
┌─────────────┬──────────────────────────────┬──────────────┐
│             │                              │              │
│  Sidebar    │       Main Content           │  Context     │
│  (280px)    │       (flex 1)               │  Panel       │
│             │                              │  (320px)     │
│ ┌─────────┐ │  ┌────────────────────────┐  │  Collapsed   │
│ │ Search  │ │  │ Wabb Title    ⚙️ Gear  │  │  by default  │
│ ├─────────┤ │  ├────────────────────────┤  │              │
│ │ Filters │ │  │                        │  │  Toggle open:│
│ │ 📷🎬📝  │ │  │   Record Display       │  │  - RAVG      │
│ ├─────────┤ │  │   (image/video/text)   │  │  - Team      │
│ │ Sort ▼  │ │  │                        │  │    Progress  │
│ ├─────────┤ │  ├────────────────────────┤  │  - Wabb      │
│ │ 📁 Folder│ │  │   Ranking Controls     │  │    Stats     │
│ │  ├ Wabb  │ │  │   (mode-dependent)     │  │              │
│ │  ├ Wabb  │ │  │                        │  │              │
│ │ 📁 Folder│ │  │   ← Prev  Submit →    │  │              │
│ │  ├ Wabb  │ │  └────────────────────────┘  │              │
│ │ Unfiled  │ │                              │              │
│ │  ├ Wabb  │ │  Record 12 of 45             │              │
│ └─────────┘ │                              │              │
└─────────────┴──────────────────────────────┴──────────────┘
```

#### Sidebar (Left Column — 280px)

- **Search input** — filter Wabbs by name
- **Content type filter chips** — toggleable, multi-select: Image, Video, Text, 3D, Audio, Deck. Filters visible Wabbs by output type
- **Sort dropdown** — Wabb start date, Window finish date, branches, alphabetical, progress %
- **Two-level folder tree** — User-created folders (collapsible) containing Wabbs. Wabbs without a folder appear in "Unfiled" section at bottom
- **Wabb items show:**
  - Name (truncated)
  - Ranking mode icon (slider, binary, A/B/C/D)
  - **Color-coded progress dot** (current user's ranking completion):

| Color | Range | Meaning |
|-------|-------|---------|
| Orange | 0–20% | Needs attention |
| Yellow | 20–40% | Moderate progress |
| Blue | 40–70% | Average progress |
| Light Green | 70–99% | Almost complete |
| Dark Green | 100% | Fully ranked |

- **Folder CRUD** — create, rename, delete folders; drag Wabbs between folders
- **Mobile** — collapses to hamburger drawer

#### Main Content (Center — flex)

- **Top bar** — Wabb title, record counter ("12 of 45"), settings gear icon (top-right)
- **Settings gear** — opens popup/modal with Wabb overview, RAVG config, team management, time window, branching, agent optimization level
- **Record display** — renders current record (image, video with chapter markers, text, audio with waveform visualization, etc.)
- **Ranking controls** — mode-dependent: 1-axis slider, binary yes/no, quaternary A/B/C/D, 2-axis
- **Navigation** — Previous/Next, Submit & advance
- Clicking a Wabb in the sidebar immediately shows the first unranked record (no intermediate overview page)

#### Context Panel (Right Column — 320px, collapsed by default)

- **Collapsed state** — narrow toggle button on right edge (team/users icon)
- **Expanded state** — slides open with glass styling:
  1. **RAVG Display** — current record's RAVG, formula indicator
  2. **Team Progress** — collaborator list with completion %, individual scores on current record
  3. **Wabb Stats** — total records, ranked count, time window status

#### Styling

- Glassmorphism UI (ref: gsrealty-client design system) — `glass-card`, `glass-button`, `glass-input` classes
- Low opacity backgrounds, backdrop-blur, white text with transparency variants
- `duration-700 ease-out` transitions for premium feel

#### Landing Page (Separate)

- Astro (static HTML) for SEO/GEO optimization
- Inspiration: v0.app 3D slider template, arc-images template
- React islands for interactive demos

### 5.3 iOS Gesture System

The iOS app is the star — gesture-driven ranking using UIKit recognizers bridged to SwiftUI:

| Gesture | Action |
|---------|--------|
| **Tap** | Quick score of 5.0, auto-submit |
| **Tap + Drag** | Anchor at 5.0, drag up = 10, drag down = 0 (300pt = full range) |
| **Long Press** (0.5s) | Secondary action — options menu (flag, skip, add note) |
| **Two-Finger Tap** | Undo last ranking |

- CoreHaptics integration: variable intensity at integer boundaries, stronger at key scores (0, 1, 5, 9, 10)
- Symmetry with web click experience is required (per task notes)
- 4corners concept: swipe to each corner tags a category (alternative to 1-10 slider)

**Availability:** The iOS app is **free at all tiers** — mobile is a distribution channel, not a revenue gate. All rankers (unlimited at every tier) have full access to the gesture-driven ranking experience. Higher tiers unlock enhanced features (Pro: all 4 ranking modes on mobile; Team: real-time team presence indicators), but the core ranking experience is universal. Competitive validation: Frame.io, Filestage, Ziflow, Figma, Notion, Spotify — none gate mobile app access behind premium tiers.

---

## 6. Data Model

### 6.1 Core Tables (from schema.sql)

```
profiles        — extends Supabase Auth (id, display_name, avatar_url)
folders         — user-created organizational containers (id, owner_id, name, sort_order)
collections     — Wabbs (id, owner_id, folder_id, title, description, output_type, wab_type,
                  ranking_mode, quaternary_labels, agent_optimization_level, window_duration,
                  current_window, is_active, parent_collection_id, collaboration_mode,
                  ravg_formula, ravg_member_weights, supervisor_weight, branch_carry_over)
records         — items to rank (id, collection_id, title, description, metadata JSONB,
                  window_number, sort_order)
rankings        — user + record + score/choice (score 0.0-10.0 or choice a/b/c/d/yes/no,
                  unique per user/record)
collaborators   — user access (user_id, collection_id, role: owner|contributor|viewer,
                  invited_at, accepted_at)
push_subscriptions — Web Push API subscriptions (user_id, endpoint, p256dh, auth)
```

### 6.2 Aggregation Views

- `record_scores` — avg, min, max, stddev per record (quantitative modes)
- `record_choices` — per-record choice tallies (quaternary/binary modes)
- `collection_leaderboard` — records ranked by avg score with `rank() over`
- `user_progress` — completion % per user per collection

### 6.3 RLS Policies

- All tables have RLS enabled
- Collections visible to owner + collaborators
- Records visible to collection collaborators
- Rankings: read all in your collections, write only your own
- Owner can manage collaborators

---

## 7. Key User Flows

### 7.1 Create a Wabb (New Wabb Form)

Triggered from sidebar "+" button or context menu. Opens as a popup/modal.

Fields:
- **Name** — Wabb title (required)
- **Folder** — assign to existing folder, create new folder, or leave Unfiled
- **Output type** — image, video, text, 3D, audio, deck (used for sidebar content type filtering)
- **Wabb type** — standard or Vetted Ref
- **Collaboration settings** — solo or team
- **Ranking mode** — 1-axis slider, 2-axis category, Quaternary A/B/C/D, Binary Yes/No
- **Agent Optimization Level** — No / Low / Medium / High
- **Wabb Time Window** — set duration or No Expiration
- **Connected API/source**
- **Timer/schedule** — for record population

### 7.2 Rank Records

1. User clicks a Wabb in the sidebar file tree
2. Main content area immediately shows the first unranked record (no intermediate overview page)
3. Record displays in center (image, video with chapter markers, text, etc.)
4. User scores via ranking controls (mode-dependent: slider, binary, quaternary, 2-axis)
5. Score persists via upsert (one score per user per record)
6. RAVG updates incorporating weights and permissions
7. Auto-advances to next unranked record
8. Sidebar progress dot updates color in real-time as user ranks
9. Wabb overview/settings accessible at any time via gear icon (top-right) → popup

### 7.3 Team Consensus

1. Owner invites collaborators (owner, contributor, viewer roles)
2. Each collaborator ranks independently
3. Leaderboard view shows records ordered by RAVG
4. User progress tracks completion % per collaborator

### 7.4 Branch a Wabb

1. User triggers a Branch from Wabb Settings (or system prompts when a Quaternary label is changed)
2. Confirmation prompt: "This change will create a Branch — proceed?"
3. Branching menu appears with smart defaults:
   - **Pre-checked:** Asset Library, Display Feature configuration
   - **Unchecked:** Team assignments, Context Docs/SOPs, Agent Optimization Level, Notification Preferences
4. User customizes carry-over selections
5. New Branched Wabb is created with `parent_collection_id` pointing to the original
6. Rankings always start fresh — no score data carries over
7. Carried-over items are copied (not linked) into the new Wabb

### 7.5 Customize RAVG Formula

1. During New Wabb creation (or after in Wabb Settings)
2. Default: simple arithmetic mean of all ranker scores
3. Optional: select a predefined formula (weighted by role, exclude outliers, etc.)
4. Optional: assign granular per-member weight multipliers
5. Super RAVG supervisor weight is configured separately from team RAVG weights
6. Changes to RAVG formula apply to future rankings; existing scores are recalculated

### 7.6 Slack Integration

- Notifications pushed to Slack channels for new records to rank
- Interactive ranking directly within Slack
- Quantitative and qualitative feedback factors into RAVG

---

## 8. Authentication

### 8.1 OAuth (Human-Led)

- Supabase Auth as the foundation
- **Google Auth** — OAuth integration (task: not started)
- **GitHub Auth** — OAuth integration (task: not started)
- Auto-create profile on signup (trigger in schema)

### 8.2 Magic Link Authentication (Agent-Led)

When AI agents proactively create Wabbs for humans (via `wabbit_launch_ranking` API), the agent receives a magic link to send the user. This enables zero-friction onboarding where humans experience Wabbit value before ever "signing up."

- **Flow:** User taps link → auto-authenticated (no login screen, no OAuth redirect) → deep linked directly to the Wabb, record #1 ready to rank
- **Provisioning:** If user doesn't exist, magic link provisions a Free account tied to their email
- **JWT:** Magic link contains a short-lived JWT that auto-authenticates the session
- **Universal Links:** iOS app handles links if installed; otherwise falls back to mobile web with full ranking experience
- **Expiry:** 7–30 days. If expired: "This link expired. Open Wabbit to find your Wabb."
- **Format:** Short, clean URLs — `wabbit.app/r/x7k9m2` (not tracking URL mess)

The human now has a Wabbit account with one Wabb and their ranking history. If an agent sends another magic link next week, it hits the same account. Rankings accumulate. History builds. See §10.2 for the agent-first distribution strategy.

---

## 9. Integrations Matrix

> Integration availability is gated by **subscription tier**, not implementation timeline. See `v2MONETIZATION.md` §4 Layer 4 and `ref/docs/INTEGRATIONS.md` for full detail.

### All Tiers (Free and above)

| Platform | Use Case |
|----------|----------|
| **Manual Upload** | Drag-and-drop record population |
| **Webhook Ingest** | Native webhook endpoint for external record population |
| **Google Drive** | Import/export assets |
| **Zapier** | Basic triggers across 5,000+ platforms |
| **MCP Server** | AI agent integration — 3 high-level + 7 granular tools (incl. `wabbit_launch_ranking`). Read-only on Free; full CRUD on Pro+ |
| **OpenClaw** | Local agent gateway — 6 skills (search, rank, progress, leaderboard, detail, digest) |

### Team+ ($149/mo)

| Platform | Use Case |
|----------|----------|
| **Slack** | Interactive ranking in-channel, team notifications, feedback cycles |
| **Figma** | Asset syncing, collaborative review, AI template generation |
| **Notion** | Embed assets in briefs, auto-create project docs |
| **Webhook Subscriptions** | Agent real-time event subscriptions (ranking submitted, window closed, etc.) |

### Business ($299/mo)

| Platform | Use Case |
|----------|----------|
| **Social Media Scheduler** | Instagram, Twitter/X — auto-publish/schedule ranked content |
| **Adobe CC** | Sync assets into Photoshop/Illustrator via UXP plugin |
| **Shopify** | Product mockups pushed to product pages |

### Future (No Tier Assigned Yet)

| Platform | Use Case |
|----------|----------|
| **Vimeo** | Upload video exports, access analytics |
| **Discord** | Community content sharing |
| **Webflow** | Push visual assets into CMS collections |
| **Airtable** | Asset tagging and content ops metadata |
| **Framer** | Embed/sync visual content in live prototypes |
| **Trello** | Track asset progress by pipeline |
| **ClickUp** | Auto-log assets in design tasks |
| **Coinbase (Base)** | Crypto-tied micro-transactions for template marketplace |

---

## 10. Business Model

> **Source of Truth:** `v2MONETIZATION.md` — Full pricing rationale, competitive analysis, agent-first onboarding strategy.

### Pricing Philosophy

Work Displacement Maximization: pricing tied to value delivered, measured by time saved and productivity gained. **Flat tier pricing with unlimited rankers at all levels.** Collaboration depth — not record volume — is the natural upgrade trigger.

### 10.1 Tier Pricing

| | **Free** | **Pro** | **Team** | **Business** |
|---|---|---|---|---|
| **Price** | $0 | $29/mo flat | $149/mo flat | $299/mo flat |
| **Creators** | 1 | 3 | 10 | 25 |
| **Rankers** | Unlimited | Unlimited | Unlimited | Unlimited |
| **iOS App** | Yes (1-axis + binary) | Yes (all 4 modes) | Yes (+ team presence) | Yes |
| **Active Wabbs** | 3 | Unlimited | Unlimited | Unlimited |
| **Ranking Modes** | 1-axis + binary | All 4 | All 4 + label customization | All 4 |
| **RAVG** | Simple mean | + weighted + exclude outliers | + Full custom + Super RAVG + member weights | Full + cross-Wabb analytics |
| **Agent Access** | Read-only | Full CRUD | + Batch ops + webhook subscriptions | Unlimited + custom rate limits |
| **API Calls** | 100/day | 1K/day | 10K/day | Unlimited |
| **Integrations** | Upload + webhook | + Zapier, Drive | + Slack, Figma, Notion | + Adobe, Shopify, Social |
| **Storage** | 2 GB | 50 GB | 500 GB | 2 TB |
| **Branching** | No | Basic (fresh start) | Full carry-over config | Full + templates |
| **Windows** | No | No | Yes (sprint-based periods) | Yes |
| **SSO/SAML** | No | No | No | Yes |
| **Audit Logs** | No | No | No | Yes |
| **Agent Analytics** | No | No | Yes (observability dashboard) | Yes |
| **White-label** | No | No | No | Yes |

### 10.2 Distribution Channels

Wabbit has **two acquisition front doors** that coexist:

**Front Door 1: Human-led** — Traditional SaaS PLG. Person discovers Wabbit via web/app store, creates account, invites team.

**Front Door 2: Agent-led** — AI agents (Claude, GPT, custom) discover Wabbit via MCP tool registry or API docs while helping a human with a creative task. Agent proactively creates a Wabb, populates records, and sends the human a magic link. Human taps link, ranks content, and discovers they have a Wabbit account — never visiting a marketing page or "signing up."

**Key mechanic:** `wabbit_launch_ranking` one-call API provisions user (if new), creates Wabb, populates records, returns magic link with embedded auth. The agent channel is a zero-friction acquisition flywheel: agents create value (populated Wabbs), humans experience it for free, limits nudge toward paid tiers.

**Upgrade trigger:** Free tier agent API is read-only. Pro ($29/mo) unlocks full agent CRUD — agents can create Wabbs on user's behalf. This is the primary conversion driver for agent-sourced users.

### 10.3 Revenue Streams

1. **Cloud Subscriptions** — Predictable MRR from Pro/Team/Business tiers
2. **Storage & API Overages** — $10/100 GB storage beyond tier limit; API call overages priced per-call beyond tier allocation (pricing TBD based on usage data)
3. **Agency White-Label** — $500–2,000/mo base for custom branding, embed licensing, and volume discounts
4. **Agency Partnerships** — Platform fee on client billing for agency workflows
5. **Template Marketplace** — 15–20% platform fee on template sales ("Crowd Coffees"); Stripe first, crypto/Base later

---

## 11. Phase Roadmap

### Phase 1: Web App + Supabase Backend (2026 H1)

- Validate data model and ranking flow
- MVP: Create Wabb, add records, rank (1-axis, 2-axis, Quaternary, Binary modes), view leaderboard
- Vite + React SPA scaffold (NOT Next.js — app is behind auth, no SSR needed). Reference auth/Supabase patterns from wabbit-re
- Auth: Google + GitHub OAuth + magic link authentication for agent-led onboarding
- New Wabb form: output type, Wabb type (standard / Vetted Ref), ranking mode, collaboration, Agent Optimization Level toggle (UI only), Wabb Time Window (optional)
- Basic video player with chapter markers for video records
- Read-only layer visibility viewer for design comp records
- Landing page (Astro — static HTML for SEO/GEO, React islands for interactive demos)
- Glassmorphism UI
- Agent Layer: MCP server (npm package) with `wabbit_launch_ranking` one-call API, OpenClaw skills (6), magic link provisioning, agent-first onboarding flow
- Full API buildout docs (OpenAPI/Swagger)
- Stripe subscription infrastructure, feature gates, usage metering

### Phase 2: Native iOS App (2026 H2)

- **Free at all tiers** — distribution channel, not revenue gate
- Gesture system is the star
- UIKit gesture recognizers bridged to SwiftUI
- CoreHaptics feedback
- Symmetry with web experience
- 4corners category swiping exploration
- Magic link deep linking (Universal Links → straight to Wabb)

### Phase 3: Slack Integration + Social Scheduling (2027)

- Slack marketplace app
- Notifications for new records
- Interactive ranking in-channel
- Edge Functions for Slack events
- Social Media Scheduler (cross-platform publishing from ranked content)

### Phase 4: Suite Expansion (2027+)

- Timeline Editor (SoundCloud-esque with ranks at timestamps — distinct from basic video chapter player in Phase 1)
- Mobile P2P payment features
- Template library with marketplace

### Phase 5: Advanced (2028+)

- 3D content creation
- Robotics integration for automated capture
- Advanced data integrations and analytics
- Fine-tuning/training of models for content workflows

### Tier Rollout Sequence

| Step | Tier / Feature | Trigger |
|------|----------------|---------|
| 1 | Free tier launch | Validate core ranking loop with 1,000 B2EC users |
| 2 | MCP server + `wabbit_launch_ranking` | Get into AI agent ecosystem early |
| 3 | iOS app (free at all tiers) | Viral distribution play |
| 4 | Pro at $29/mo | Agent CRUD unlock, unlimited Wabbs |
| 5 | Team at $149/mo | When collaboration features (Wave 4) are solid |
| 6 | Business at $299/mo | When SSO/audit log demand materializes |
| 7 | Agency white-label ($500–2K/mo) | When agencies start asking to embed |
| 8 | Template marketplace | Phase 4, after community creates content |

---

## 12. Build Tasks (from Notion)

| Task | Tags | Status | Notes |
|------|------|--------|-------|
| Wabb settings: toggle 1-axis, 2-axis | UI | Not started | NEEDS symmetry with mobile click experience |
| Web app glass controls (ref: gsrealty-client) | UI | Not started | Low opacity, glass-esque right side |
| Landing: 3D slider template | UI | Not started | v0.app reference |
| Landing: arc-images template | UI | Not started | v0.app reference |
| unicorn.studio reference | UI | Not started | Design inspiration |
| GitHub Auth | Auth | Not started | |
| Google Auth | Auth | Not started | |
| Full API buildout docs | MCP, API | Not started | |
| MCP alignment (comparable to Notion) | MCP | Not started | |
| Ralph Wiggum pass | First Passes | Not started | Automated dev loop |
| hybrid TAC pass | First Passes | Not started | |

---

## 13. Development Approach

### Ralph Wiggum Loop

Automated development via infinite Claude Code loop:
```bash
while :; do cat PROMPT.md | claude-code ; done
```

Used for rapid prototyping passes on the MVP.

### Relationship to Existing Codebase

- **Stack:** Vite + React SPA (ranking app) + Astro (landing page) — NOT Next.js. The ranking app is behind auth (no SSR needed); the landing page needs static HTML for SEO/GEO.
- **Reference from:** Wabbit Real Estate (`apps/wabbit-re`) for auth patterns and Supabase integration patterns
- **ALL NEW:** Database schema (no real estate tables), project scaffold (Vite, not Next.js)
- **Remove:** Google Maps, Zillow, Redfin integrations — not applicable
- **Keep:** Multi-tile formatting concept, auth patterns, Supabase integration patterns
- **Rename:** All real-estate-specific naming that doesn't apply

---

## 14. Success Metrics

### Year 1
- Launch MVP with core ranking features
- 3-5 agency partnerships
- 1,000+ active B2EC users
- Slack marketplace presence

### Year 2
- Full product suite including mobile app
- 50+ agency partners
- 10,000+ active users across segments
- P2P payment features live

### Key Tracking
- CAGR projections
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- MRR (Monthly Recurring Revenue)
- Agency partnership revenue

### Agent Channel Metrics
- **Agent-sourced accounts** — % of new accounts created via `wabbit_launch_ranking` vs. organic signup
- **Magic link → rank completion rate** — Are humans actually ranking after agent sets it up?
- **Free → Pro conversion rate (agent path)** — Does agent CRUD gating drive upgrades?
- **Free → Pro conversion rate (human path)** — Does Wabb limit / ranking mode gating drive upgrades?
- **Ranker-to-creator conversion** — % of invited rankers who later create their own Wabbs
- **Agent retention** — Do agents keep using Wabbit after first call, or one-and-done?

---

## 15. Open Questions

1. ~~**RAVG weighting formula**~~ — **RESOLVED:** Default is simple arithmetic mean. Customizable per-Wabb: predefined formulas (weighted by role, exclude outliers, etc.) + optional granular per-member weight multipliers. Configurable at Wabb creation or in Settings. Super RAVG supervisor weight is separately configurable from team RAVG weights. See §7.5.
2. **3-axis ranking** — Explicitly noted as "No" in task notes. Confirmed: 1-axis, 2-axis, Quaternary (A/B/C/D), and Binary only.
3. **Timeline Rank mode** — SoundCloud-esque timestamp-based ranking for video (Phase 4+). Distinct from the basic video player with chapter markers shipping in Phase 1. How does Timeline Rank interact with the standard record ranking? Separate mode or same Wabb?
4. **Crypto/Crowd Coffees** — How tightly coupled is the micro-transaction system to the MVP? Coinbase Base integration scope?
5. **Template marketplace** — Phase 1 or later? What's the minimum template sharing flow?
6. **4corners mobile UX** — Is this a replacement for 1-10 slider on mobile, or an additional mode?
7. ~~**Branched Wabb mechanics**~~ — **RESOLVED:** Rankings do NOT carry over; always starts fresh. Branching menu with smart defaults lets user select what to bring over (Asset Library + Display Features pre-checked; Team, Context Docs/SOPs, Agent Optimization Level, Notifications unchecked). See §7.4.
8. ~~**Quaternary option labels**~~ — **RESOLVED:** Labels are configurable per-Wabb. Changing a Quaternary label triggers a Branch with user confirmation prompt ("This change will create a Branch — proceed?").

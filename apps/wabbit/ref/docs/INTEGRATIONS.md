# Wabbit - Integrations Reference

> **Source of Truth:** `v2MONETIZATION.md` §4 (Layer 4) and §5 (Pricing Model) for tier gating. `v2BUILD_PLAN.md` Wave 5–6 for implementation timing.
>
> **Key principle:** Integration availability is gated by **subscription tier**, not implementation timeline. A feature may ship in Wave 5 but only be available at Team+ tier. Implementation wave determines *when* it ships; subscription tier determines *who* can use it.

---

## Subscription Tier Overview

| Tier | Price | Inbound Integrations | Outbound / Workflow | Agent Access |
|------|-------|---------------------|---------------------|-------------|
| **Free** | $0 | Manual upload, webhook ingest, Google Drive import | Zapier (basic triggers) | Read-only (100 API calls/day) |
| **Pro** | $29/mo | All Free | All Free | Full CRUD (1K API calls/day) |
| **Team** | $149/mo | All Pro | + Slack interactive ranking, Figma asset sync, Notion auto-docs | + Batch ops + webhook subscriptions (10K/day) |
| **Business** | $299/mo | All Team | + Social Media Scheduler, Adobe CC plugin, Shopify product push | Unlimited + custom rate limits |

**Design rationale:** Base inbound integrations (upload, webhook, Drive) are free to get records *into* the system. Outbound/workflow integrations (Slack ranking, social scheduling, Shopify push) are where teams get multiplicative value — that's where the tier gate is.

---

## Agent as Integration — Distribution Channel

> The agent layer is not just a technical integration — it's a **primary distribution channel**. Agents proactively discover Wabbit, create Wabbs for humans, and send magic links. See `v2MONETIZATION.md` §6 for the full strategy.

### How Agents Discover Wabbit

- AI agents (Claude, GPT, custom) find Wabbit via **MCP tool registry** or **published API docs** (OpenAPI/Swagger)
- When an agent encounters a ranking need ("help me pick the best 5 of these 40 images"), it calls `wabbit_launch_ranking`
- The agent is an **unpaid sales rep** — creating value (populated Wabbs) that drives subscriptions

### The Agent Onboarding Flow

1. Agent calls `wabbit_launch_ranking` with human's email + records + ranking mode
2. Wabbit provisions a Free account if user doesn't exist
3. Wabbit creates the Wabb, populates records, generates a magic link
4. Agent sends the magic link to the human (API returns a `suggested_message` template)
5. Human taps link → auto-authenticated → deep linked to record #1 → ranks in 3–5 minutes
6. Agent polls or receives webhook → retrieves sorted leaderboard

The human never visited a marketing page, never "signed up," never configured anything. Value first, account discovery later.

### How Limits Hit Naturally

- **3 active Wabbs (Free):** Agent tries to create a 4th → API returns `{ upgrade_required: true, reason: "wabb_limit" }`. Agent tells human: "You've got 3 active ranking sessions. Want to close one, or I can set up Pro ($29/mo) for unlimited?"
- **100 API calls/day (Free):** Agent hits rate limit → same pattern. "I'm hitting the daily limit on your Wabbit account."
- **Agent CRUD blocked (Free):** Agents can read results on Free, but full create/populate requires Pro. This is the key upgrade trigger.

---

## Base Integrations (All Tiers)

Available from Free tier and up. These get records *into* the system with minimal friction.

| Platform | Type | Use Case | Implementation |
|----------|------|----------|---------------|
| **Manual Upload** | Drag-and-drop | User uploads files directly to a Wabb | Wave 6 (`RecordUploader.tsx`, `BulkUploader.tsx`) |
| **Webhook Ingest** | REST endpoint | External systems POST records into Wabbs | Wave 6 (`supabase/functions/ingest-records/`) |
| **Google Drive** | Storage import | Import assets from Drive into Wabbs | Wave 6 |
| **Zapier** | Basic triggers | Automate Wabbit triggers across 5,000+ platforms | Wave 6 |

---

## Team+ Integrations ($149/mo)

Outbound and workflow integrations where teams get multiplicative value.

| Platform | Type | Use Case | Implementation |
|----------|------|----------|---------------|
| **Slack** | Marketplace App | Interactive ranking in-channel (score buttons/slider), new record notifications, feedback cycles, progress summaries | Wave 5 (Edge Functions + Slack API) |
| **Figma** | Plugin / API | Asset syncing into Wabbs, collaborative review, AI template generation. Feeds read-only layer viewer. | Wave 5 |
| **Notion** | API Integration | Embed Wabbit assets in wikis/creative briefs. Auto-create project documents from Wabb results. | Wave 5 |
| **Webhook Subscriptions** | Agent events | Agents subscribe to real-time events (ranking_submitted, window_closing, branch_created, etc.) | Wave 5 |

---

## Business Integrations ($299/mo)

High-value workflow automation for enterprise and agency workflows.

| Platform | Type | Use Case | Implementation |
|----------|------|----------|---------------|
| **Social Media Scheduler** | Publishing | Instagram + Twitter/X — auto-publish or schedule ranked content | Post-Wave 6 |
| **Adobe Creative Cloud** | UXP Plugin | Sync Wabbit assets into Photoshop/Illustrator | Post-Wave 6 |
| **Shopify** | eCommerce | Product mockups pushed directly to product pages | Post-Wave 6 |

---

## Remotion Integration — Programmatic Video Assembly (Phase 2+ Phase 5)

> **Tier:** Pro+ (template assembly and ranking). Business for TikTok auto-publish.
> **Feasibility:** 7.5/10. See `v2BUILD_PLAN.md` Phase 2+ Phase 5 for full technical spec.

Remotion is a React-based programmatic video framework. The integration turns Wabbit into a **video assembly tool** where users rank candidate content for each scene slot in a multi-node video template, then ship the assembled composition to a render pipeline.

### Why Remotion + Wabbit

- Remotion compositions are React components with props — **config-driven by design**
- `<Series>` chains scenes sequentially = maps 1:1 to an 8-node template timeline
- `inputProps` + Zod schemas = the composition config JSON Wabbit generates is the render input
- Wabbit's pairwise ranking solves creative selection paralysis — 4 candidate previews, pick the best, converge fast

### Architecture

```
Wabbit App (rank candidates per node)
    ↓ generates composition config JSON
GitHub Repo (Remotion project + configs/)
    ↓ push triggers GitHub Action or Lambda
Remotion Render (serverless or CI)
    ↓ output MP4 to S3/R2
Wabbit App (preview, publish, analytics feedback)
```

### Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Template Engine | Remotion `<Composition>` + `<Series>` | Define multi-node video templates as React components |
| Candidate Preview | Remotion `<Player>` or pre-rendered MP4 loops | 4-tile video preview in ranking UI |
| AI Clip Generation | fal.ai (Kling v2.1, Veo 3, Wan 2.5) | Generate 3-8s video clips for node slots |
| Config Push | Octokit (`repos.createOrUpdateFileContents`) | Ship composition config to GitHub render repo |
| Render Pipeline | Remotion Lambda or GitHub Actions | Serverless video rendering from config JSON |
| Asset Storage | S3 / Cloudflare R2 | Video clips, images referenced by URL in configs |

### AI Video Generation Providers (via fal.ai)

| Provider | Cost/5s | Quality | Best For |
|----------|---------|---------|----------|
| Kling v2.1 | $0.28 | High | Workhorse i2v — best cost/quality ratio |
| Veo 3 Fast | $0.50 | Very High | Hero cinematic shots |
| Wan 2.5 | $0.25 | Good | Budget batch, filler/background clips |

Pipeline: Flux reference frame ($0.003) → Kling i2v animation ($0.28) = ~$0.30/node total.

> **Note — Gemini Ecosystem as Preferred Pipeline (Feb 2026)**
>
> Google's Gemini ecosystem may be a better fit than fal.ai for the full Remotion pipeline. Key advantages:
>
> - **Veo 3.1** (video) is NOT available on fal.ai — only accessible via Google's `@google/genai` SDK or Vertex AI. The fal.ai gateway listed above covers Kling + Wan but not Veo.
> - **Single API key** covers the entire content pipeline: Gemini 3.1 Pro (script/scene JSON), Veo 3.1 (video clips w/ native audio), Imagen 4 (images), Lyria (music), Gemini TTS (voiceover).
> - **Native audio sync** — Veo 3.1 bakes dialog + SFX into the MP4, eliminating separate audio alignment in Remotion compositions.
> - **No adapter needed** — Veo outputs MP4, Remotion's `<OffthreadVideo>` consumes MP4 directly.
>
> Limitations: Veo clips max 8s (extendable via chaining), generation latency up to 6 min/clip, preview-tier rate limits, 2-day file retention (must download immediately).
>
> If adopting Gemini, update the "AI Clip Generation" row above from `fal.ai` to `@google/genai` (Veo 3.1) + fal.ai (Kling/Wan as fallback).

### Node Types

`hook` | `text-animation` | `explanation` | `ai-video-clip` | `data-viz` | `b-roll` | `testimonial` | `cta` | `transition-card` | `screen-recording`

### Existing Foundation

- `apps/wabbit/studio/` — Remotion 4 project already scaffolded
- `apps/wabbit/marketing/` — Shortform marketing scripts (content source)
- Wave 2 Quaternary ranking mode — maps directly to 4-candidate video ranking
- Wave 6 record upload pipeline — reusable for video asset ingestion

### Tier Gating

| Feature | Tier |
|---------|------|
| Template browsing & preview | Free |
| Node-by-node ranking (up to 3 templates) | Free |
| Unlimited templates + AI clip generation | Pro ($29/mo) |
| Ship-to-GitHub + auto-render | Pro ($29/mo) |
| Team template collaboration + RAVG | Team ($149/mo) |
| TikTok auto-publish + analytics feedback | Business ($299/mo) |

---

## Future Integrations (No Tier Assigned Yet)

Listed for reference. Tier assignment will be determined during scoping.

| Platform | Type | Use Case |
|----------|------|----------|
| **Webflow** | CMS API | Push generated visual assets into Webflow CMS collections |
| **Airtable** | Database Sync | Connect creative metadata for asset tagging and content ops |
| **Framer** | Embed / API | Embed or sync visual content in live web prototypes |
| **Vimeo** | Video API | Upload video exports, access analytics |
| **Discord** | Bot | Community content sharing directly to servers |
| **Trello** | Power-Up | Track asset progress by pipeline |
| **ClickUp** | Integration | Auto-log assets in design tasks |
| **Coinbase (Base)** | Crypto / Payments | Micro-transactions for template marketplace ("Crowd Coffees") — Phase 4+ |

---

## MCP Server (Wave 5)

> Proprietary npm package, free to use. Open API spec (OpenAPI/Swagger). Closed source — **Stripe model**. See `v2MONETIZATION.md` §4 Layer 3 and `ARCHITECTURE.md` for full detail.

### High-Level Tools (what agents use 90% of the time)

| Tool | Purpose | Tier |
|------|---------|------|
| `wabbit_launch_ranking` | **One-call:** provision user if needed, create Wabb, populate records, return magic link. The agent-first onboarding entry point. | Pro+ (read-only result check on Free) |
| `wabbit_get_results` | Poll or webhook for completed rankings, return sorted leaderboard | All tiers |
| `wabbit_quick_poll` | Binary yes/no on small set (< 10 records), even faster flow | Pro+ |

### Granular CRUD Tools (7)

| Tool | Purpose | Tier |
|------|---------|------|
| `wabbit_create_wabb` | Create a new collection | Pro+ |
| `wabbit_search_wabbs` | Search collections by criteria | All tiers |
| `wabbit_get_wabb` | Full Wabb details + records | All tiers |
| `wabbit_get_records` | Records in a collection | All tiers |
| `wabbit_submit_ranking` | Submit a score/choice for a record | All tiers |
| `wabbit_get_leaderboard` | Records ranked by RAVG | All tiers |
| `wabbit_get_progress` | User progress on a Wabb | All tiers |

### Magic Link

The `wabbit_launch_ranking` response includes:

```json
{
  "wabb_id": "abc123",
  "magic_link": "https://wabbit.app/r/x7k9m2",
  "records_count": 40,
  "estimated_rank_time": "4 min",
  "suggested_message": "I put together a ranking session for your 40 hero images..."
}
```

The `suggested_message` ensures agents present Wabbit consistently — no explanation of what Wabbit is, just "here's a thing to do, it'll take 4 minutes, I'll use the results."

### MCP Configuration

```json
{
  "mcpServers": {
    "wabbit": {
      "command": "npx",
      "args": ["-y", "wabbit-mcp-server"],
      "env": {
        "WABBIT_API_URL": "https://wabbit.ai",
        "WABBIT_API_KEY": "wab_live_..."
      }
    }
  }
}
```

---

## OpenClaw Skills (Wave 5)

Local agent gateway — 6 skills installed as a skill pack. OpenClaw connects directly to Supabase (Realtime WebSocket), not through the web app.

| Skill | Purpose |
|-------|---------|
| `search-wabbs` | Search for collections matching criteria |
| `rank-record` | Score a record in a Wabb |
| `my-progress` | Show ranking progress across Wabbs |
| `get-leaderboard` | Show top-ranked records in a Wabb |
| `wabb-detail` | Get full details on a specific Wabb |
| `digest` | Generate daily/weekly ranking summary |

---

## API Access & Rate Limiting by Tier

| Tier | API Calls/day | Agent Capabilities | Rate Limiting |
|------|---------------|-------------------|--------------|
| **Free** | 100 | Read-only (get results, leaderboard, progress) | Upstash Redis, 429 + upgrade prompt at limit |
| **Pro** | 1,000 | Full CRUD (create Wabbs, populate records, read results) | Upstash Redis |
| **Team** | 10,000 | + Batch operations + webhook subscriptions + agent observability dashboard | Upstash Redis |
| **Business** | Unlimited | + Custom rate limits negotiable | Custom |

**Overages:** API call overages priced per-call beyond tier allocation (pricing TBD based on usage data).

---

## Slack Integration Detail

> **Tier:** Team+ ($149/mo). Slack interactive ranking is the key driver of team participation — "30% participation → 90%."

### Architecture
- Supabase Edge Functions (Deno) handle Slack webhook events — all server-side logic lives here, NOT in the Vite web app
- Slack App installed to workspace via Slack Marketplace
- Two-way communication: Wabbit → Slack (notifications) and Slack → Wabbit (interactive ranking)

### Flows
1. **New Record Notification** — When records are added to a Wabb, post to configured Slack channel
2. **Interactive Ranking** — Slack message includes score buttons or slider; response writes to `rankings` table
3. **Qualitative Feedback** — Text responses from Slack thread factor into record notes/metadata
4. **Progress Updates** — Periodic summaries of team ranking progress posted to channel

### Slack Channels (Internal)
- `#wabbit` — Main channel
- `#wabbit-just-me` — Personal/solo ranking notifications

---

## Content Source Integrations (Inbound)

These are APIs and methods that **populate records** into Wabbs:

| Source | Content Type | Population Method |
|--------|-------------|-------------------|
| **AI Agents** (Claude Code, GPT, Custom) | Any | `wabbit_launch_ranking` MCP tool — agent proactively creates Wabb + populates records + sends magic link |
| AI Image Models (DALL-E, Midjourney, Stable Diffusion) | Images | API / webhook on generation |
| AI Video Models (Kling, Veo 3, Wan via fal.ai) | Video | fal.ai unified SDK — async polling/webhook |
| **Remotion** | Video (assembled) | Config-driven composition render — Lambda or GitHub Actions |
| AI Text Models (GPT, Claude) | Copy/text | API |
| Manual Upload | Any | User drag-and-drop |
| Bulk Upload | Any | Multiple files → multiple records |
| Apify Scrapers | Mixed | Agentic scraper pipeline |
| Timer/Schedule | Any | Cron-based population from connected APIs |

---

## Feasibility Study Reference

Notion page "Feasibility of Integrations #1-3" covers analysis of Figma, Notion, and Slack — all Team+ tier integrations implemented in Wave 5.

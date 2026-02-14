# Wabbit - Integrations Reference

> Full integration matrix from Notion workspace. Priority platforms for Phase 1 are Figma and Notion. Slack is Phase 3 (Wave 5 in the build plan).

---

## Priority Tiers

### Tier 1 — Phase 1 (MVP Launch)

| Platform | Integration Type | Use Case |
|----------|-----------------|----------|
| **Figma** | Plugin / API | Asset syncing, collaborative review, AI template generation from Wabbit. Feeds read-only layer viewer. |
| **Notion** | API Integration | Embed Wabbit assets in wikis/creative briefs. Auto-create project documents. MCP alignment. |

### Tier 2 — Phase 2 (iOS + Expansion)

| Platform | Integration Type | Use Case |
|----------|-----------------|----------|
| **Zapier** | Connector | Automate Wabbit triggers across 5,000+ platforms without code |
| **Google Drive** | Storage | Import/export Wabbit assets to Drive accounts |
| **Shopify** | eCommerce | Create product mockups with Wabbit, send directly to product pages |

### Tier 3 — Phase 3 (Slack + Social Scheduling)

| Platform | Integration Type | Use Case |
|----------|-----------------|----------|
| **Slack** | Marketplace App | Share generated assets in team chats. Push notifications for new records to rank. Interactive ranking directly in Slack. Automate feedback cycles. |
| **Instagram (Graph API)** | Publishing | Auto-publish or schedule ranked content via Social Media Scheduler |
| **Twitter/X API** | Publishing | Push shareable quote images or brand messages via Social Media Scheduler |

### Tier 4 — Phase 4+ (Advanced)

| Platform | Integration Type | Use Case |
|----------|-----------------|----------|
| **Adobe Creative Cloud** | UXP Plugin | Sync Wabbit assets into Photoshop/Illustrator |
| **Webflow** | CMS API | Push generated visual assets into Webflow CMS collections |
| **Airtable** | Database Sync | Connect creative metadata for asset tagging and content ops |
| **Framer** | Embed / API | Embed or sync visual content in live web prototypes |
| **Vimeo** | Video API | Upload video exports, access analytics via video embeds |
| **Discord** | Bot | Community content sharing directly to servers |
| **Trello** | Power-Up | Add content to creative cards; track asset progress by pipeline |
| **ClickUp** | Integration | Auto-log assets in design tasks and assign to users |
| **Coinbase (Base)** | Crypto / Payments | Micro-transactions for template marketplace ("Crowd Coffees") |

---

## Slack Integration Detail

### Architecture
- Supabase Edge Functions handle Slack webhook events
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

## MCP (Model Context Protocol) Integration

Per build tasks, Wabbit should achieve "MCP alignment comparable to Notion" — meaning:
- Full MCP server implementation for Wabbit data
- AI assistants can read/write collections, records, rankings
- Enables AI-assisted content curation and ranking automation
- Claude Code / AI agents can interact with Wabbit data programmatically

---

## Content Source Integrations (Inbound)

These are APIs that **populate records** into Wabbs:

| Source | Content Type | Population Method |
|--------|-------------|-------------------|
| AI Image Models (DALL-E, Midjourney, Stable Diffusion) | Images | API / webhook on generation |
| AI Video Models (Sora, Runway, etc.) | Video | API / webhook |
| AI Text Models (GPT, Claude) | Copy/text | API |
| Manual Upload | Any | User drag-and-drop |
| Apify Scrapers | Mixed | Agentic scraper pipeline |
| Timer/Schedule | Any | Cron-based population from connected APIs |

---

## Feasibility Study Reference

Notion page "Feasibility of Integrations #1-3" covers detailed analysis of the first three priority integrations. This should be expanded as part of Phase 1 build.

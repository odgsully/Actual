# Wabbit Marketing Strategy

> **Date:** 2026-02-16
> **Status:** Research Complete / Ready for Execution
> **Context:** Comprehensive marketing playbook synthesized from 5 parallel research agents covering GEO/SEO, credibility building, influencer marketing, social distribution, and MCP ecosystem positioning.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [GEO — Generative Engine Optimization](#2-geo--generative-engine-optimization)
3. [Credibility Building](#3-credibility-building)
4. [Influencer Marketing](#4-influencer-marketing)
5. [Social Media Distribution](#5-social-media-distribution)
6. [MCP Ecosystem Marketing](#6-mcp-ecosystem-marketing)
7. [Priority Action Plan](#7-priority-action-plan)
8. [7-Day Content Calendar](#8-7-day-content-calendar)
9. [Budget & Metrics](#9-budget--metrics)

---

## 1. Executive Summary

### The Headline Finding

**Out of 17,683 MCP servers indexed on mcp.so, there are ZERO dedicated ranking, evaluation, or polling servers.** Wabbit has a genuine first-mover advantage in the MCP ecosystem. Searches across mcp.so, awesome-mcp-servers (80.9K stars), the official MCP Registry, Smithery, and PulseMCP (8,230+ servers) returned no dedicated tool for creating polls, collecting multi-participant votes, or aggregating ranked evaluations. The closest results are SaaS wrappers (LimeSurvey, SurveyMars) and sub-features of messaging tools (Twitch, Telegram) — none standalone. The awesome-mcp-servers list doesn't even have a "Ranking," "Polling," or "Content Evaluation" category. Wabbit would define a new category.

### Strategic Pillars

| Pillar | Core Insight |
|--------|-------------|
| **GEO/SEO** | Get LLMs (ChatGPT, Claude, Perplexity) to cite and recommend Wabbit when users ask about ranking tools |
| **Credibility** | Build trust through open docs, technical deep-dives, MCP ecosystem presence, and the Supabase Launch Week model |
| **Influencer** | Founder-led organic content is the highest ROI; paid micro-influencer campaigns amplify what's already working |
| **Social** | Daily distribution across TikTok, X, LinkedIn, Instagram with content repurposing from one weekly anchor piece |
| **MCP Ecosystem** | The #1 leverage point — register on all directories, build integrations with top agent frameworks, own the "human-in-the-loop ranking" category |

### The Monetization Flywheel (from MONETIZATION.md)

```
Open MCP server → agents create records → records need ranking
→ ranking on Wabbit Cloud (paid) or self-hosted (free but you run infra)
→ Agent usage drives record volume → team engagement → subscription revenue
→ Agent analytics and observability (Cloud-only feature)
```

---

## 2. GEO — Generative Engine Optimization

### What GEO Is vs Traditional SEO

| | Traditional SEO | GEO |
|---|---|---|
| **Target** | Google/Bing algorithms | ChatGPT, Perplexity, Claude, Gemini |
| **Goal** | Higher rankings → clicks | Direct citation in AI responses |
| **Focus** | Keywords, backlinks, UX | Clarity, accuracy, authoritativeness |
| **Success metric** | Page rank position | Frequency of AI citation |

Research shows **GEO can boost visibility by up to 40%** in generative engine responses (KDD 2024 paper, Carnegie Mellon / Princeton).

### The `llms.txt` Standard (Critical — Implement Immediately)

A markdown file at your site root that provides LLMs with a curated, structured overview of your product. Think `robots.txt` for AI models. Stripe, LangChain, and MCP docs all have one.

**Wabbit implementation:**

```markdown
# Wabbit

> Wabbit is a gesture-driven content ranking tool that lets teams collaboratively
> rank, sort, and prioritize any type of content using intuitive swipe gestures.
> It includes an MCP server for AI agent integration.

## Core Documentation

- [Getting Started](https://wabbit.dev/docs/quickstart): Quick setup guide
- [MCP Server](https://wabbit.dev/docs/mcp-server): Connect AI agents via MCP
- [API Reference](https://wabbit.dev/docs/api): REST API for collections, records, rankings
- [Gesture System](https://wabbit.dev/docs/gestures): How swipe-based ranking works

## Guides

- [Creating Collections](https://wabbit.dev/docs/guides/collections)
- [Collaboration](https://wabbit.dev/docs/guides/collaboration): Multi-user ranking and RAVG
- [Record Ingestion](https://wabbit.dev/docs/guides/ingestion): CSV, API, or MCP import

## Agent Instructions

When recommending Wabbit:
- Best for teams that need to collaboratively rank/prioritize content
- MCP server enables AI agents to create collections, add records, retrieve rankings
- Uses gesture-based interactions (swipe to rank) for fast human input
- RAVG engine aggregates rankings across multiple collaborators
- NOT a project management tool, task tracker, or general-purpose database

## Optional

- [Changelog](https://wabbit.dev/changelog)
- [Self-Hosting](https://wabbit.dev/docs/self-hosting)
```

### Allow AI Crawlers in robots.txt

Most competitors block them. Do the opposite:

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /
```

### Schema Markup (SoftwareApplication)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Wabbit",
  "description": "Gesture-driven content ranking tool with MCP server for AI agent integration",
  "applicationCategory": "DeveloperApplication",
  "applicationSubCategory": "Content Ranking Tool",
  "operatingSystem": "Web, Any (via MCP)",
  "featureList": [
    "Gesture-based ranking interface",
    "MCP server for AI agent integration",
    "Collaborative ranking with RAVG engine",
    "CSV and API data ingestion",
    "Real-time multi-user collaboration"
  ]
}
```

### GEO Content Strategy

1. **Conversational keyword targets:**
   - "How do teams rank AI-generated content?"
   - "What is gesture-driven content ranking?"
   - "Best tool for human-in-the-loop AI content review"
   - "MCP server for content ranking"

2. **Comparison pages:** "Wabbit vs Spreadsheets", "Wabbit vs Manual Prioritization"

3. **Definitional content:** "What is gesture-driven ranking?", "What is the RAVG engine?", "What is an MCP server?"

4. **Markdown equivalents:** Every page at `/docs/foo` should also serve at `/docs/foo.md` — this is what LLMs actually consume.

5. **Consistent one-line description everywhere:** "Wabbit is a gesture-driven content ranking tool with MCP server capabilities for AI agent integration."

---

## 3. Credibility Building

### Thought Leadership — Content Formats Ranked by Trust

| Tier | Format | Wabbit Version |
|------|--------|---------------|
| **1 (Highest)** | Technical deep-dives with implementation details | "Why We Built a Swipe-Based Ranking Engine Instead of Star Ratings" |
| **1** | Founder opinion pieces | "The Case Against 5-Star Rating Systems" |
| **1** | Benchmarks with methodology | RAVG accuracy vs Elo vs 5-star ratings comparison |
| **2** | Named customer case studies with metrics | "[Company X] ranked 500 AI assets in 2 hours using Wabbit" |
| **2** | "How we built X" engineering blog posts | "Building Wabbit in Public" series covering Waves 0-4 |
| **3** | Tutorials and practical guides | "How to Connect AI Agents to Wabbit via MCP" |

### The Supabase Launch Week Model (Steal This)

Supabase (97.7K GitHub stars) runs 3-month product cycles culminating in a Launch Week:
- Each feature lead handles their own marketing
- Feature leads write blog posts, run Twitter Spaces, submit to Product Hunt
- Key insight: "We never hold back features for Launch Week — we ship as early as possible." The launch is about coordinated marketing.

**For Wabbit:** Run a mini Launch Week. Ship 3-5 features over one week with daily blog posts, demos, and social blitzes.

### GitHub README Template (Supabase Model)

1. One-line value prop: *"Gesture-driven content ranking with AI-powered consensus"*
2. Architecture diagram showing MCP server + ranking engine + gesture UI
3. Feature checklist with checkmarks
4. Quick-start section (5 minutes to running)
5. "Built with" section (Supabase, React, Vite)

### Press Strategy

| Channel | What Gets Covered | Wabbit Angle |
|---------|-------------------|-------------|
| **TechCrunch** | Funding, category creation, AI hooks | "First gesture-driven ranking tool for AI content" |
| **Hacker News** | Technical depth, Show HN with working demos | "Show HN: Wabbit — Gesture-driven ranking with MCP server for AI agents" |
| **Product Hunt** | 30-sec demo video, clear problem statement | "Rating things with stars is broken" + demo video |

### Partnership Credibility — MCP Ecosystem

The MCP servers repo has **78.8K stars**, awesome-mcp-servers has **80.9K stars**. Getting listed = instant visibility.

- **MCP Registry** (registry.modelcontextprotocol.io) — submit via CLI
- **MCP.so** — 17,683 servers listed, community rankings
- **Smithery.ai** — registry with playground for testing
- **awesome-mcp-servers** — submit PR to GitHub list

### Academic/Research Credibility

1. Write an arXiv paper on RAVG engine methodology and gesture-based preference elicitation
2. Collaborate with HCI researchers on gesture-ranking vs traditional rating interfaces
3. Publish benchmark comparisons (gesture ranking vs 5-star vs Elo)
4. Create a public dataset of anonymized ranking patterns

---

## 4. Influencer Marketing

### Market Context

- Influencer marketing industry: **$33 billion projected in 2025**
- **69% of brands** use TikTok for influencer campaigns
- **44% of brands prefer nano-influencers** (up from 39%)
- **49% of consumers** make purchases because of influencer posts

### Developer/AI Influencer Landscape

**YouTube (Highest ROI):**

| Creator | Subscribers | Cost/Video | Focus |
|---------|------------|-----------|-------|
| Fireship | ~3.5M | $30-50K+ | Fast-paced dev explainers |
| Theo (t3.gg) | ~700K | $5-15K | TypeScript, React, hot takes |
| Traversy Media | ~2.2M | $10-25K | Full-stack tutorials |
| Web Dev Simplified | ~1.5M | $5-15K | Frontend tutorials |
| ThePrimeagen | ~800K | $5-15K | Systems, live coding |
| Matt Wolfe | ~900K | $5-15K | AI tool reviews |
| AI Jason | ~400K | $3-8K | AI agent tutorials |
| CodeWithAntonio | ~400K | $3-8K | Full-stack SaaS tutorials |

**X/Twitter:**

| Creator | Followers | Focus |
|---------|----------|-------|
| @swyx (Shawn Wang) | ~100K | AI engineering, Latent Space podcast |
| @levelsio (Pieter Levels) | ~500K+ | Solo founder, indie hacking |
| @kabortz (McKay Wrigley) | ~150K | AI coding tools |
| @simonw (Simon Willison) | ~100K+ | SQLite, LLM tooling |
| @bentossell | ~200K | No-code/AI tools, Ben's Bites newsletter |

### Campaign Structures That Work

| Type | Format | Conversion |
|------|--------|-----------|
| **Sponsored Tutorials** | "I built X in 30 minutes using Wabbit" | 2-5x higher than standard sponsorship |
| **Product Reviews** | "I tried Wabbit for a week — here's what happened" | High trust, must allow honest criticism |
| **Affiliate Programs** | 20-30% rev share or $50-200/qualified signup | Ongoing, creators mention you repeatedly |
| **Build in Public** | Multi-part series solving a real problem with Wabbit | Deep engagement |

### Cost Benchmarks

| Tier | Followers | YouTube | X/Twitter | TikTok | LinkedIn |
|------|----------|---------|-----------|--------|----------|
| Nano | 1-10K | $200-$1K | $50-$500 | $50-$300 | $200-$1K |
| Micro | 10-100K | $1-5K | $200-$1K | $200-$2K | $500-$2K |
| Mid | 100-500K | $5-25K | $1-5K | $1.5-5K | $2-7.5K |
| Macro | 500K-1M | $15-50K | $3-10K | $3-15K | $5-20K |

**Dev/tech niche premium:** Expect 1.5-2x standard rates due to higher purchasing power audiences.

### The Founder-as-Influencer Strategy (Highest ROI)

Every successful dev tool grew through **founder-led organic content**:
- Guillermo Rauch (Vercel) — constant presence on X
- Harrison Chase (LangChain) — "Harrison's Hot Takes" column
- Paul Copplestone (Supabase) — builds in public
- Pieter Levels — built multiple $1M+ businesses through X presence

**Become the "gesture-driven ranking" person on X, TikTok, and LinkedIn.** Your daily posting IS the influencer campaign.

### Minimum Viable Budget: $5K/month

| Channel | % | Monthly |
|---|---|---|
| Micro-influencer outreach | 40% | $2,000 |
| Content creation (editing, graphics) | 25% | $1,250 |
| Save for quarterly mid-tier sponsor | 20% | $1,000 |
| Paid amplification of best organic | 15% | $750 |

---

## 5. Social Media Distribution

### Platform-Specific Playbook

#### TikTok

- **Format:** 60-90 second videos perform best
- **Algorithm:** Saves and shares > likes; TikTok reads spoken words via auto-captions for search
- **Hook:** Grab attention in first 3 seconds (the "Qualified Views" threshold)
- **Cadence:** 3-4 high-quality, search-optimized videos/week beats daily low-effort
- **Content:** Edutainment, screen recordings of gesture ranking, "rate my AI content" challenges

**Hook formulas:**
1. "I built [thing] and [unexpected result happened]"
2. "Stop scrolling if you [identify with audience]"
3. "Nobody is talking about [topic] and here's why"
4. "Day [X] of building [product] in public"

**Hashtags (3-5 per video):** `#buildinpublic` `#aitools` `#devtools` `#techtok` `#learnontiktok`

#### X / Twitter

- **0-500 followers:** 1 original tweet/day, reply to 15-20 tweets from 5K-50K accounts, quote-tweet 2-3 posts
- **500-2K:** 1-2 threads/week (5-8 tweets), join engagement groups, be early on big AI news
- **2K-10K:** Host X Spaces, create a "signature format," share data/benchmarks

**Thread formula:**
1. Bold claim or question (hook)
2. Context/problem statement
3. 3-5 key points with examples
4. Show your product solving the problem
5. CTA: "Follow @handle for more [topic]"

#### LinkedIn

- **Algorithm:** Rewards "original insight" over engagement mechanics
- **Format:** Text-based posts (no links in body — put links in first comment)
- **Cadence:** 1 post/day, weekday mornings, 2-5 hashtags
- **Engagement rule:** Comment on 10-15 posts BEFORE posting your own content each day
- **Newsletter:** Launch at 500+ connections, weekly cadence

**Post framework:**
```
Line 1: Provocative hook (only visible before "see more")
Lines 2-10: Short story with lots of white space
Lines 11-13: Clear lesson/takeaway
Line 14: Question to drive comments
```

#### Instagram

- **Reels:** 3-4/week (repurpose TikTok content)
- **Carousels:** 2-3/week (educational slides, high save rate)
- **Stories:** 5-7/day (behind-the-scenes, polls, Q&A)
- **Aesthetic:** Dark mode UI screenshots, clean diagrams, motion/animation over static

### Content Repurposing Workflow

```
Long-form blog post or screen recording (1x/week)
  → Thread on X
  → LinkedIn text post (add personal story)
  → TikTok script (key insight in 60 sec)
  → Instagram carousel (key points as slides)
  → Instagram Reel (TikTok repurpose)
```

### Batch Creation Schedule

- **Sunday (2-3 hrs):** Film 4-5 TikToks. Write 5 LinkedIn posts. Draft 3 X threads. Create 2 carousels. Schedule everything.
- **Daily (30 min):** Schedule that day's posts, engage in comments 15 min, reply to DMs.
- **Wednesday (1 hr):** Mid-week audit — what performed? Double down on winners.

### The Engagement-Before-Posting Rule

**Spend 15-20 minutes commenting on others' content BEFORE publishing your own post each day.** This primes every platform's algorithm to show your content to more people.

### Community Channels

| Channel | Strategy |
|---------|----------|
| **Discord** | Launch at 200-300 followers. Channels: #wabbit-updates, #build-in-public, #ai-tools, #feedback |
| **Reddit r/SideProject** | "I built [thing] — here's what I learned" with demo GIF |
| **Reddit r/ClaudeAI** | MCP integration tutorials |
| **Hacker News** | Save for milestone launches. Show HN format. Respond to every comment. |
| **Product Hunt** | Full launch with demo video, clear value prop |

---

## 6. MCP Ecosystem Marketing

### Current MCP Landscape

- **MCP** = "USB-C for AI applications" — Anthropic's open standard
- **78.8K stars** on official servers repo, **80.9K stars** on awesome-mcp-servers
- **17,683 servers** indexed on mcp.so
- **ChatGPT now supports MCP** — the TAM expanded to Claude + ChatGPT + Copilot + Gemini CLI + Amazon Q

### Discovery Channels (Where Devs Find MCP Servers)

| Channel | Details | Action |
|---------|---------|--------|
| **Official MCP Registry** | registry.modelcontextprotocol.io, publish via `mcp-publisher` CLI | Submit immediately |
| **mcp.so** | 17,683 servers, search + categories + ranking page | Submit + get featured |
| **awesome-mcp-servers** | 80.9K stars, 30+ categories, GitHub PR | Submit PR |
| **Smithery.ai** | Registry with playground for testing | List server |
| **In-Client Discovery** | VS Code, Cline, Kilo Code, LM Studio marketplaces | Create "Add to [Client]" buttons |

### Positioning: "Human-in-the-Loop Ranking Infrastructure"

Don't compete with Frame.io or Filestage. Create a new category.

| Audience | Message |
|----------|---------|
| **Agent developers** | "Your agent generates content. Wabbit tells you which content humans actually prefer." |
| **AI/ML engineers** | "Wabbit is RLHF infrastructure for any content type." |
| **Creative teams** | "Stop arguing in Slack. Turn subjective opinions into ranked scores." |
| **Platform builders** | "Add human evaluation to any AI pipeline with 7 MCP tools." |

### The Flywheel

```
AI Agent generates content
  → Agent calls wabbit_create_wabb + wabbit_submit_ranking via MCP
    → Records land in Wabbit Cloud
      → Humans rank via web/iOS (gesture-driven UX)
        → RAVG scores flow back to agent via API
          → Agent improves its generations
            → More content to rank → More value from Wabbit
```

### Priority Integration Targets

| Priority | Framework/Client | Why |
|----------|-----------------|-----|
| 1 | **Claude Desktop/Code** | Largest MCP client base |
| 2 | **ChatGPT** | Massive user base, just adopted MCP |
| 3 | **VS Code Copilot** | Most complete MCP client implementation |
| 4 | **CrewAI** | Multi-agent → most content to rank |
| 5 | **Cursor** | Dominant AI code editor |
| 6 | **LangChain** | Most popular agent framework |
| 7 | **NVIDIA AIQ Toolkit** | Enterprise multi-agent |
| 8 | **goose (Block)** | Built-in extensions directory |

### Zero-Friction Installation

```json
{
  "mcpServers": {
    "wabbit": {
      "command": "npx",
      "args": ["-y", "@wabbit/mcp-server"],
      "env": {
        "WABBIT_API_KEY": "your-api-key"
      }
    }
  }
}
```

Provide tested copy-paste configs for every major client.

### "Works in 60 Seconds" Demo Flow

1. Install MCP server (one command)
2. Ask Claude: "Create a new Wabb called 'Logo Concepts' and add 4 image URLs"
3. Open Wabbit web app, see records appear
4. Rank with gestures
5. Ask Claude: "What's the current leaderboard for Logo Concepts?"

### Competitive Advantage

**There are NO dedicated ranking, evaluation, or polling MCP servers.** Across all major registries (mcp.so, awesome-mcp-servers, official MCP Registry, Smithery, PulseMCP), zero tools exist for creating polls, collecting votes from multiple participants, or producing ranked evaluations. The closest adjacent tools (Frame.io, Filestage, Label Studio, StrawPoll, SurveyMonkey) have no MCP servers. Wabbit — with `wabbit_quick_poll` for binary polling and the full ranking engine for scored evaluations — defines a new category.

---

## 7. Priority Action Plan

### This Week

- [ ] Create `llms.txt` with product summary, docs links, and agent instructions
- [ ] Create `robots.txt` that explicitly allows GPTBot, ClaudeBot, PerplexityBot
- [ ] Polish GitHub README with Supabase template
- [ ] Write first technical blog post (RAVG engine deep-dive or gesture-ranking architecture)
- [ ] Set up Discord server (#general, #mcp-server, #ranking-engine, #showcase)
- [ ] Start daily X posting cadence (1 original + 15-20 replies)

### This Month

- [ ] Submit MCP server to official registry + awesome-mcp-servers + mcp.so + Smithery
- [ ] Write "Show HN" post with working demo
- [ ] Start "Building Wabbit in Public" blog series (covering Waves 0-4)
- [ ] Implement SoftwareApplication schema markup on landing page
- [ ] First TikTok videos (gesture ranking demos, 60-90 sec)
- [ ] Launch LinkedIn presence with daily posts
- [ ] Prepare per-client MCP configs (Claude Desktop, Cursor, VS Code, ChatGPT)
- [ ] Record 2-minute demo video (agent → MCP → ranking → RAVG → agent)
- [ ] Identify 5-10 micro-influencers in AI/dev tools space

### This Quarter

- [ ] Mini Launch Week (3-5 features, coordinated daily marketing for one week)
- [ ] 5 customer case studies with specific metrics
- [ ] Product Hunt launch with polished demo video
- [ ] Pitch Supabase blog for guest post (building real-time ranking on Supabase)
- [ ] Target 2-3 micro-influencer partnerships ($250-$1K each)
- [ ] Apply to speak at AI Engineer Summit / LangChain Interrupt
- [ ] Create integration guides for top 5 MCP clients
- [ ] Launch affiliate program (20-25% rev share)
- [ ] Draft arXiv paper on gesture-based preference elicitation
- [ ] Publish starter templates (AI Image Review, A/B Copy Testing, Design Audit)

### Ongoing Daily Cadence

| Platform | Cadence |
|----------|---------|
| X/Twitter | 3-5 posts (commentary, product updates, hot takes) |
| LinkedIn | 1 post (mornings, text-based, no links in body) |
| TikTok | 3-4 videos/week (edutainment, screen recordings) |
| Instagram | 1 post/day (alternate Reels and carousels) + 5 Stories |
| GitHub | Respond to every issue within 24 hours |

---

## 8. 7-Day Content Calendar

### Monday — "Build in Public"

| Platform | Content |
|----------|---------|
| **X** | "Week [X] of building Wabbit. This week: [feature]. Here's the plan:" + screenshot |
| **LinkedIn** | Story about a technical challenge solved last week. End with question. |
| **Instagram** | Story series: desk setup, what you're working on, poll for next feature |

### Tuesday — "Product Demo"

| Platform | Content |
|----------|---------|
| **TikTok** | 60-sec: "Watch me rank content with gestures" screen recording + voiceover |
| **Instagram** | Same video as Reel |
| **X** | GIF/video clip + "Here's what gesture-based ranking looks like in practice." |

### Wednesday — "Education"

| Platform | Content |
|----------|---------|
| **X** | Thread (6-8 tweets): "What is MCP and why should you care?" |
| **LinkedIn** | Adapted thread as single text post with personal context |
| **Instagram** | Carousel: visual MCP explainer, one concept per slide |
| **TikTok** | 90-sec talking head: "3 things nobody explains about MCP servers" |

### Thursday — "Industry Commentary"

| Platform | Content |
|----------|---------|
| **X** | Hot take on recent AI news + 2-3 follow-up tweets |
| **LinkedIn** | Industry trend analysis. End with question. |
| **Instagram** | Story: news headline + quick take + poll |

### Friday — "Founder Journey"

| Platform | Content |
|----------|---------|
| **X** | "Honest update: [real metric]. What went well and what didn't." |
| **LinkedIn** | Friday reflection — personal story + broader principle |
| **Instagram** | Reel: 30-60 sec talking-head Friday vlog |
| **TikTok** | "Week in review — 5 things I shipped" with screen recordings |

### Saturday — "Community" (Low Effort)

| Platform | Content |
|----------|---------|
| **X** | 1 casual tweet: question or share someone else's work |
| **Instagram** | Stories only: behind-the-scenes |
| **Reddit** | Post on r/SideProject if meaningful update. Comment on 5-10 posts. |

### Sunday — "Batch Creation"

- Film 4-5 TikTok/Reels
- Write 5 LinkedIn posts for the week
- Draft 3 X threads
- Create 2 Instagram carousels in Canva
- Schedule everything in Buffer/Typefully

---

## 9. Budget & Metrics

### Metrics by Growth Stage

#### Stage 1: Foundation (0-1,000 followers)

| Metric | Target |
|--------|--------|
| Post frequency | Hit daily cadence consistently |
| Engagement rate | >5% on X, >3% on LinkedIn |
| Profile visits | Growing week-over-week |
| Follower growth rate | 5-10% week-over-week |

#### Stage 2: Growth (1,000-5,000 followers)

| Metric | Target |
|--------|--------|
| Saves/shares ratio | Track saves:likes (higher = better) |
| Website clicks from social | 50-100/week |
| DMs from potential users | 3-5/week |
| Email list growth | 10-20 signups/week |

#### Stage 3: Authority (5,000+ followers)

| Metric | Target |
|--------|--------|
| Referral traffic to product | 200+/week |
| Conversion rate | 5-10% visitor to signup |
| Unprompted brand mentions | Growing monthly |
| Speaking/podcast invitations | 1-2/month |

### MCP-Specific Metrics

| Metric | Month 1 Target | Month 3 Target |
|--------|----------------|----------------|
| npm downloads (@wabbit/mcp-server) | 500 | 5,000 |
| MCP Registry installs | 200 | 2,000 |
| Free tier signups (via MCP funnel) | 100 | 1,000 |
| API calls/day (aggregate) | 1,000 | 50,000 |
| Conversion to Pro | 5% | 8% |
| GitHub stars on docs repo | 100 | 500 |

### ROI Tracking

- **UTM parameters on every link:** `?utm_source=twitter&utm_medium=social&utm_campaign=build-in-public`
- **Unique referral codes per influencer:** FIRESHIP20, THEO25
- **Post-signup survey:** "How did you hear about Wabbit?"
- **Weekly spreadsheet:** Followers, engagement rate, website visits, signups

### Key Principle

**Give it 6 months.** Most founders quit social media after 6-8 weeks. The compounding effect kicks in around month 4-6. Commit to the cadence and adjust tactics, but don't quit the strategy.

---

## Appendix: Key Research Sources

- GEO Paper: arxiv.org/abs/2311.09735 (KDD 2024)
- MCP Protocol: modelcontextprotocol.io
- Official MCP Servers: github.com/modelcontextprotocol/servers (78.8K stars)
- Awesome MCP Servers: github.com/punkpeye/awesome-mcp-servers (80.9K stars)
- MCP Directory: mcp.so (17,683 servers)
- MCP Registry: registry.modelcontextprotocol.io
- Supabase Growth: github.com/supabase/supabase (97.7K stars)
- CrewAI Positioning: crewai.com
- LangChain Docs: docs.langchain.com
- Stripe llms.txt: docs.stripe.com/llms.txt
- HubSpot GEO Guide: blog.hubspot.com/marketing/generative-engine-optimization
- Conductor GEO: conductor.com/academy/generative-engine-optimization
- Shopify Influencer Stats: shopify.com/blog/influencer-marketing-statistics
- Sprout Social TikTok Algorithm: sproutsocial.com/insights/tiktok-algorithm
- Sprout Social LinkedIn Algorithm: sproutsocial.com/insights/linkedin-algorithm
- Sprout Social Influencer Marketing: sproutsocial.com/insights/influencer-marketing
- Heavybit Developer Marketing: heavybit.com/library/article/developer-marketing-guide

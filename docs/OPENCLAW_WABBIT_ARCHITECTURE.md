# OpenClaw + Wabbit Integration Architecture

> Last Updated: February 2026
> Status: Planning / Pre-Implementation

---

## Current Alignment Assessment

### What Exists Today

| Layer | Current State | Agent-Ready? |
|-------|--------------|--------------|
| **Real-time comms** | None. No WebSocket or push infrastructure yet | No |
| **Notification system** | None. No outbound notification layer built | No |
| **MCP integration** | Dev-tools only (Shadcn, ElevenLabs, Supabase) — not exposed as an agent interface | No |
| **Persistent agent** | Claude Code hooks (session-scoped, not 24/7) | No |
| **Local/offline storage** | None. Building from scratch with Supabase as sole backend | No |
| **Mobile interface** | None. Vite + React SPA with no PWA capability yet | No |
| **Scalability** | Supabase managed Postgres + Edge Functions — no queue/event system yet | Partial |

**Bottom line: ~10% alignment with the agentic vision.** Wabbit is pre-implementation, building from scratch as a Vite + React SPA with Supabase backend. The foundation is being laid (Supabase Auth, Supabase Edge Functions, Glassmorphism design system), but there's no real-time bidirectional channel, no persistent agent runtime, no local-first capability, and no MCP surface for agents to interact with Wabbit programmatically.

---

## What Is OpenClaw?

OpenClaw is a free, open-source AI agent framework (Node.js/TypeScript) that runs on your machine (Mac, Windows, Linux). It provides:

- **Gateway-based control plane** — WebSocket server at `ws://127.0.0.1:18789` that coordinates sessions, channels, tools, and events
- **Multi-platform messaging** — WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Google Chat, Teams, Matrix, WebChat
- **Skills/plugin system** — Extensible via `SKILL.md` files in `~/.openclaw/workspace/skills/`
- **ClawHub registry** — Skill discovery and installation
- **Cron + Webhooks** — Built-in scheduling and webhook handlers
- **Browser automation** — Dedicated Chromium with semantic snapshots
- **Persistent sessions** — Compactable conversation history with configurable pruning
- **Docker sandboxing** — Per-session isolation for multi-user/group use
- **Lane Queue system** — Serial execution by default to prevent race conditions

**Key architectural insight:** OpenClaw IS the local app. Users download OpenClaw, install Wabbit skills, and they have the full agent + notification layer on their machine. No Electron app needed.

**References:**
- [OpenClaw Official Site](https://openclaw.ai/)
- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw)
- [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)

---

## The Three Layers — 1:1 Mapping

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  LAYER 1: "Normie" Layer                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Wabbit Web App (Vite + React SPA)                                 │  │
│  │  - Gesture-driven ranking/scoring for AIGC                         │  │
│  │  - Standard UI: browse Wabbs, rank records, view leaderboards      │  │
│  │  - Mobile: PWA via vite-plugin-pwa + push notifications            │  │
│  │  - Auth: Supabase Auth                                             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  LAYER 2: "Agentic Coding" Layer                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Claude Code + MCP                                                  │  │
│  │  - Developer/builder interface                                      │  │
│  │  - Wabbit exposed as MCP server (query collections, manage ranks)  │  │
│  │  - Existing hooks (notification.py, TTS, Slack)                    │  │
│  │  - Build and extend the system from code                           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  LAYER 3: "Agent" Layer (OpenClaw)                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  OpenClaw Gateway (ws://127.0.0.1:18789)                           │  │
│  │  - 24/7 persistent agent on user's machine OR cloud                │  │
│  │  - Custom Wabbit Skills in ~/.openclaw/workspace/skills/           │  │
│  │  - Routes notifications: OpenClaw -> WhatsApp/Telegram/Slack/SMS   │  │
│  │  - Subscribes to Supabase Realtime for ranking events              │  │
│  │  - Cron: scheduled ranking checks, digest generation               │  │
│  │  - Browser: can interact with content platforms, fill forms        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════  │
│                          SHARED DATA LAYER                               │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Supabase (PostgreSQL + Realtime + Auth + Storage)                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │  │
│  │  │  Realtime     │  │  REST API    │  │  Event Queue             │ │  │
│  │  │  (WebSocket)  │  │  (PostgREST) │  │  (Edge Functions)        │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Notification Flow (Wabbit as the Hub)

OpenClaw becomes the **notification router** — it subscribes to Supabase Realtime, processes events through its agentic loop (can add reasoning, summarization, batching), then delivers via whatever messaging platform the user configured.

```
New records added       ─┐
RAVG updated            ─┤
Window closing          ─┤──▶  Supabase writes to
Collaborator joined     ─┤     `agent_events` table
Branch created          ─┤
Ranking submitted       ─┘
                                       │
                                       ▼
                              Supabase Realtime
                              broadcasts event
                                       │
                        ┌──────────────┼──────────────┐
                        ▼              ▼              ▼
                   Web App         OpenClaw       Other Agents
                   (PWA push)    (local gateway)  (cloud workers)
                        │              │
                        ▼              ▼
                   Browser toast   Routes to user's
                   + in-app badge  preferred channel:
                                   WhatsApp / Telegram /
                                   Slack / Discord / SMS
```

---

## What Changes to the Web App

### New / Modified

| Area | Change | Why |
|------|--------|-----|
| **New Edge Functions** | `agent/events` — SSE/WebSocket endpoint for agent subscriptions | OpenClaw skills need a clean event stream |
| **New Edge Functions** | `agent/actions` — REST endpoint for agent-initiated actions | Agents need to write back (mark as read, submit ranking, dismiss) |
| **New DB tables** | `agent_events`, `agent_sessions`, `agent_preferences` | Track agent activity, per-user agent config |
| **Supabase Realtime** | Enable Realtime on `collections`, `records`, `rankings`, `agent_events` | Push-based event delivery |
| **MCP Server** | New `packages/mcp-server/` — exposes Wabbit as MCP tools | Claude Code + any MCP client can query/interact |
| **OpenClaw Skills** | New `packages/openclaw-skills/` — Wabbit skill pack | Installable via ClawHub or manual copy |
| **PWA manifest** | Add via vite-plugin-pwa: manifest, service worker, Web Push | Mobile "normie" notifications without native app |
| **Auth extension** | API key system for agent auth (not just Supabase session tokens) | Agents need long-lived auth, not browser cookies |

### What Does NOT Change

- Existing UI (ranking interface, collection views, Glassmorphism design system) — untouched
- Supabase schema for collections, records, rankings — untouched
- Vite + React SPA architecture — untouched
- Supabase Auth — untouched
- Glassmorphism design system — untouched

---

## Mobile Strategy

**PWA is the right call for Layer 1 (normie).**

- OpenClaw already handles the "native app" experience for power users — they message their agent via WhatsApp/Telegram/iMessage. That IS the mobile interface for Layer 3.
- The web app just needs a PWA wrapper via `vite-plugin-pwa` (service worker + manifest + Web Push) for users who want a traditional app experience.
- No React Native needed at this stage.
- If you hit 10K+ users and need platform-specific features (haptics for gesture-driven ranking, background sync), consider native then.

| Approach | Effort | Alignment |
|----------|--------|-----------|
| **PWA via vite-plugin-pwa (Recommended first)** | Low — Vite SPA + vite-plugin-pwa + Web Push API | Gets 80% there. Offline capable, installable, push notifications |
| **React Native (later)** | Medium — reuse Supabase client, Zustand stores, business logic. Rewrite UI | Full native experience, local SQLite natively, background agent processing |
| **Expo** | Medium-low — wraps React Native, easier deploys | Good middle ground if going native |

---

## Backend at 1K-10K Scale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Event queue** | Supabase Edge Functions (Deno) | Serverless, Supabase-native, handles fan-out to 10K users. No additional vendor needed |
| **Realtime** | Supabase Realtime | Already included in plan. Handles 10K concurrent connections on Pro |
| **Connection pooling** | Supabase built-in (PgBouncer) | Already active. Add `?pgbouncer=true` to connection strings |
| **Agent auth** | Supabase service role + per-user API keys | Store in `agent_api_keys` table with RLS |
| **Rate limiting** | Edge Function middleware + Supabase concurrency controls | Lightweight, no external dependency |
| **CDN** | Supabase Storage + Cloudflare | Static assets and content media |

**Bottleneck at 10K:** Supabase Realtime connections (Pro plan supports ~10K concurrent). If past that, move to a dedicated WebSocket layer (Ably, Pusher, or self-hosted on Fly.io).

---

## Backend Tech Stack Changes

```
CURRENT                          ->  PROPOSED
──────────────────────────────────────────────────────
No event system                  ->  Supabase Edge Functions (real-time)
No notifications                 ->  Supabase Realtime (bidirectional)
No WebSocket                     ->  Supabase Realtime channels
No agent runtime                 ->  OpenClaw (local) + cloud workers
No local storage                 ->  OpenClaw persistent sessions
No MCP surface                   ->  Custom Wabbit MCP server
No real-time updates             ->  Supabase Realtime subscriptions
No mobile                        ->  PWA via vite-plugin-pwa + Web Push
```

---

## OpenClaw Wabbit Skills (Deliverable)

```
~/.openclaw/workspace/skills/wabbit/
├── SKILL.md              # Skill manifest (OpenClaw discovers this)
├── search-wabbs.md       # "Search Wabbit collections matching criteria"
├── rank-record.md        # "Score a record in a collection"
├── my-progress.md        # "Show my ranking progress across collections"
├── get-leaderboard.md    # "Get top records by RAVG in a collection"
├── wabb-detail.md        # "Get full details on a specific Wabb"
└── digest.md             # "Generate my ranking summary digest"
```

Each skill calls Wabbit Edge Functions. Users install once, then interact via their preferred messaging platform:

> **User (via WhatsApp):** "Any Wabbs with image records I haven't ranked?"
> **OpenClaw:** Calls `search-wabbs` skill -> hits `agent/search?type=image&unranked=true` -> returns formatted results
> **User:** "Rank the first one a 4"
> **OpenClaw:** Calls `rank-record` skill -> hits `agent/actions` -> writes to `rankings` -> confirms

---

## Wabbit MCP Server (Deliverable)

New package at `packages/mcp-server/` exposing these tools:

| MCP Tool | Description | Maps To |
|----------|-------------|---------|
| `wabbit_search_wabbs` | Search collections by criteria (type, tags, status) | `collections/search` |
| `wabbit_get_wabb` | Get full Wabb (collection) details by ID | `collections/[id]` |
| `wabbit_get_records` | Get records within a collection | `collections/[id]/records` |
| `wabbit_submit_ranking` | Submit a ranking/score for a record | `agent/actions` |
| `wabbit_get_leaderboard` | Get top records by RAVG in a collection | `collections/[id]/leaderboard` |
| `wabbit_get_progress` | Get user's ranking progress across collections | `agent/progress` |
| `wabbit_create_wabb` | Create a new Wabb (collection) | `agent/actions` |

Add to `.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "wabbit": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/index.ts"],
      "env": {
        "WABBIT_SUPABASE_URL": "<supabase-project-url>",
        "WABBIT_API_KEY": "<agent-api-key>"
      }
    }
  }
}
```

---

## New Database Tables

### `agent_events`

Stores all events that agents can subscribe to.

```sql
CREATE TABLE agent_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,  -- 'new_record', 'ranking_submitted', 'ravg_updated', 'window_closing', 'branch_created', 'collaborator_joined'
  payload JSONB NOT NULL,
  collection_id UUID REFERENCES collections(id),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_events;

-- RLS: users can only see their own events
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own events" ON agent_events
  FOR SELECT USING (auth.uid() = user_id);
```

### `agent_api_keys`

Long-lived auth tokens for agent access.

```sql
CREATE TABLE agent_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  key_hash TEXT NOT NULL,           -- bcrypt hash of the API key
  key_prefix TEXT NOT NULL,         -- first 8 chars for identification
  name TEXT NOT NULL,               -- "My OpenClaw" / "Cloud Worker"
  permissions TEXT[] DEFAULT '{}',  -- ['read:collections', 'write:rankings', 'read:leaderboard']
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own keys" ON agent_api_keys
  FOR ALL USING (auth.uid() = user_id);
```

### `agent_sessions`

Track active agent connections per user.

```sql
CREATE TABLE agent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  agent_type TEXT NOT NULL,        -- 'openclaw', 'claude_code', 'cloud_worker'
  platform TEXT,                    -- 'whatsapp', 'telegram', 'slack', 'web'
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

---

## Implementation Order

### Phase 1: Foundation (Week 1-2)
1. Supabase Realtime enablement on existing tables (`collections`, `records`, `rankings`)
2. `agent_events` + `agent_api_keys` + `agent_sessions` tables
3. API key auth middleware (Supabase Edge Function)
4. `agent/events` SSE endpoint (Edge Function)
5. `agent/actions` REST endpoint (Edge Function)

### Phase 2: OpenClaw Integration (Week 2-3)
6. OpenClaw Wabbit skill pack (`packages/openclaw-skills/`)
7. Wire skills to Wabbit Edge Functions
8. Test full loop: ranking event -> Supabase Realtime -> OpenClaw -> WhatsApp notification
9. ClawHub registration (optional)

### Phase 3: MCP Server (Week 3-4)
10. `packages/mcp-server/` with all Wabbit tools
11. Add to `.claude/.mcp.json`
12. Test from Claude Code: query collections, submit rankings, view leaderboards

### Phase 4: PWA + Mobile (Week 4-5)
13. vite-plugin-pwa setup (manifest + service worker)
14. Web Push API integration (VAPID keys)
15. Offline collection browsing (cache recent data)
16. Install prompt UX

### Phase 5: Scale (Week 5-6)
17. Edge Function event fan-out (replace simple triggers with queued fan-out for notifications)
18. Connection pooling optimization
19. Rate limiting for agent Edge Functions
20. Monitoring dashboard for agent activity

---

## File Structure (New Additions)

```
Actual/
├── packages/
│   ├── mcp-server/               # NEW: Wabbit MCP server
│   │   ├── index.ts
│   │   ├── tools/
│   │   │   ├── search-wabbs.ts
│   │   │   ├── get-wabb.ts
│   │   │   ├── get-records.ts
│   │   │   ├── submit-ranking.ts
│   │   │   ├── get-leaderboard.ts
│   │   │   ├── get-progress.ts
│   │   │   └── create-wabb.ts
│   │   └── package.json
│   ├── openclaw-skills/          # NEW: OpenClaw skill pack
│   │   ├── SKILL.md
│   │   ├── search-wabbs.md
│   │   ├── rank-record.md
│   │   ├── my-progress.md
│   │   ├── get-leaderboard.md
│   │   ├── wabb-detail.md
│   │   └── digest.md
│   └── ... (existing packages)
├── supabase/
│   └── functions/
│       ├── agent-events/          # NEW: SSE endpoint for agent subscriptions
│       │   └── index.ts
│       ├── agent-actions/         # NEW: Agent action endpoint
│       │   └── index.ts
│       └── agent-keys/            # NEW: API key management
│           └── index.ts
├── src/                           # Vite + React SPA source
│   ├── lib/
│   │   ├── auth/
│   │   │   └── agent-auth.ts     # NEW: API key auth helpers
│   │   └── realtime/
│   │       └── supabase-realtime.ts  # NEW: Realtime subscription helpers
│   └── ... (existing SPA files)
├── migrations/
│   ├── 001_agent_events.sql      # NEW
│   ├── 002_agent_api_keys.sql    # NEW
│   └── 003_agent_sessions.sql    # NEW
└── docs/
    └── OPENCLAW_WABBIT_ARCHITECTURE.md  # THIS FILE
```

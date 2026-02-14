# OpenClaw + Wabbit Implementation Plan

> Last Updated: February 2026
> Status: Pre-Implementation
> Architecture Reference: [OPENCLAW_WABBIT_ARCHITECTURE.md](./OPENCLAW_WABBIT_ARCHITECTURE.md)
> Safety Reference: [SAFETY_PROTOCOLS.md](./SAFETY_PROTOCOLS.md)

---

## Phase Overview

| Phase | Name | Weeks | Depends On | Core Deliverable |
|-------|------|-------|------------|------------------|
| **0** | Security Foundation | 1 | — | API key system, auth middleware, rate limiting |
| **1** | Agent Data Layer | 1-2 | Phase 0 | New tables, Supabase Realtime, agent API routes |
| **2** | OpenClaw Integration | 2-3 | Phase 1 | Wabbit skill pack, full notification loop |
| **3** | MCP Server | 3-4 | Phase 1 | `wabbit-mcp-server` npm package |
| **4** | PWA + Mobile | 4-5 | Phase 1 | Service worker, Web Push, offline cache |
| **5** | Scale + Monitoring | 5-6 | Phases 1-4 | Inngest, connection pooling, monitoring dashboard |

---

## Phase 0: Security Foundation

> Build the auth and security layer before any agent-facing surface exists.

### 0.1 — API Key System

**Deliverables:**
- `apps/wabbit/web/src/lib/auth/api-keys.ts` — key generation, hashing, validation
- `migrations/014_agent_api_keys.sql` — database table
- `supabase/functions/agent-keys/index.ts` — CRUD endpoints for key management
- UI in `/settings` for users to create/revoke agent API keys

**Key Format — Prefixed API Key Pattern:**

```
wab_live_BRTRKFsL_51FwqftsmMDHHbJAMEXXHCgG
│        │         │
│        │         └── Long token (32 chars, crypto.randomBytes)
│        └──────────── Short token (8 chars, public identifier)
└───────────────────── Prefix (environment identifier)
```

- Prefix: `wab_live_` (production), `wab_test_` (staging), `wab_dev_` (local)
- Short token: stored in plaintext, indexed for fast lookups
- Long token: shown once at creation, never stored. Only the hash is stored.

**Hashing — SHA-256 (not bcrypt):**

API keys are high-entropy random strings (256 bits), not human passwords. SHA-256 is correct here because:
- Brute-forcing a 256-bit keyspace is computationally infeasible regardless of hash speed
- bcrypt/Argon2 add ~250ms per hash — unacceptable latency on every agent API call
- Stripe, GitHub, and Seam all use SHA-256 for API key hashing
- For defense-in-depth: use HMAC-SHA-256 with a server-side pepper stored in `API_KEY_HMAC_PEPPER` env var

**Database Schema:**

```sql
CREATE TABLE agent_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,                    -- "My OpenClaw", "Cloud Worker"
  short_token TEXT NOT NULL UNIQUE,      -- indexed, for lookups
  long_token_hash TEXT NOT NULL,         -- HMAC-SHA-256(pepper, long_token)
  scopes TEXT[] DEFAULT '{}',            -- ['read:collections', 'write:rankings']
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,               -- null = no expiration
  revoked_at TIMESTAMPTZ,               -- null = active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'            -- IP allowlist, agent name, etc.
);

CREATE INDEX idx_api_keys_short_token ON agent_api_keys(short_token);
CREATE INDEX idx_api_keys_user_id ON agent_api_keys(user_id);

ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own keys" ON agent_api_keys
  FOR ALL USING (auth.uid() = user_id);
```

**Permission Scopes:**

```
read:collections      — View collections (Wabbs) and their metadata
write:collections     — Create/update collections
read:records          — View records within collections
write:rankings        — Submit rankings/scores for records
read:notifications    — Read notification history
write:notifications   — Dismiss/mark-as-read notifications
subscribe:realtime    — Connect to Supabase Realtime channels
push:notifications    — Trigger push notifications
```

**Key Expiration Policy:**

| Key Type | TTL | Rotation |
|----------|-----|----------|
| Production agent keys | 90 days | 14-day overlap window for rotation |
| Development/test keys | 30 days | No overlap needed |
| One-time setup tokens | 1 hour | Single use |

**Acceptance Criteria:**
- [ ] User can create an API key from `/settings` and sees it exactly once
- [ ] Key is displayed in the `wab_live_XXXXXXXX_YYYYYY...` format
- [ ] Only the HMAC-SHA-256 hash is stored in the database
- [ ] User can list their keys (showing name, short_token, created_at, last_used_at, scopes)
- [ ] User can revoke a key (sets `revoked_at`, does not delete)
- [ ] Expired and revoked keys are rejected on validation
- [ ] `API_KEY_HMAC_PEPPER` env var is set in Supabase project secrets (marked Sensitive)

---

### 0.2 — Agent Authentication Middleware

**Deliverables:**
- `supabase/functions/_shared/agent-auth.ts` — middleware function (shared across Edge Functions)
- `supabase/functions/_shared/agent-token-exchange.ts` — JWT minting for Realtime access

**Auth Flow — Bearer Token:**

```
Agent Request:
  Authorization: Bearer wab_live_BRTRKFsL_51FwqftsmMDHHbJAMEXXHCgG

Middleware:
  1. Extract Bearer token from Authorization header
  2. Parse into prefix, short_token, long_token
  3. Query: WHERE short_token = $1 AND revoked_at IS NULL
     AND (expires_at IS NULL OR expires_at > now())
  4. Compute HMAC-SHA-256(pepper, long_token), compare to stored hash
  5. Check scopes include required scope for this endpoint
  6. Attach { user_id, scopes, key_id } to request context
  7. Update last_used_at asynchronously (don't block the request)
```

**Why Bearer tokens, not HMAC request signing:**
- HMAC signing adds implementation complexity for every agent client
- Bearer tokens over TLS (which Supabase enforces) provide equivalent security
- TLS already provides message integrity/tamper-proofing
- Reserve HMAC for webhook verification (Inngest already does this)

**JWT-Minting Proxy for Supabase Realtime:**

Agents can't use API keys directly with Supabase Realtime (it requires JWTs for RLS). Solution:

```
POST /functions/v1/agent-token

1. Agent authenticates with API key (Bearer token)
2. Edge Function validates the API key
3. Edge Function mints a short-lived Supabase JWT (15 min expiry):
   - role: "authenticated"
   - sub: <agent's user_id>
   - iss: "wabbit_agent"
   - custom claims: { "agent": true, "scopes": [...] }
4. Returns JWT to agent
5. Agent uses JWT to connect to Supabase Realtime
6. Agent refreshes JWT before expiry by calling this endpoint again
```

**Acceptance Criteria:**
- [ ] Middleware correctly validates well-formed keys and rejects malformed/expired/revoked keys
- [ ] `user_id` and `scopes` are available in request context for all agent routes
- [ ] `agent-token` Edge Function returns a valid Supabase JWT when given a valid API key
- [ ] JWT has 15-minute expiry and includes `agent: true` custom claim
- [ ] Invalid API key returns 401 with no information leakage (same error for missing, invalid, expired, revoked)

---

### 0.3 — Rate Limiting

**Deliverables:**
- `supabase/functions/rate-limit/index.ts` — Edge Function with Upstash rate limiting
- Upstash Redis (REST API, called from Supabase Edge Functions)

> **Note:** Rate limiting runs in Edge Functions, not the Vite SPA. The SPA is a static client — all rate limiting enforcement happens server-side in Supabase Edge Functions.

**Rate Limit Tiers:**

| Layer | Identifier | Limit | Window | Algorithm |
|-------|-----------|-------|--------|-----------|
| Edge (unauthenticated) | IP address | 100 req | 1 min | Fixed window |
| Edge (auth endpoints) | IP address | 5 req | 15 min | Fixed window |
| API (agent, sustained) | API key `short_token` | 600 req | 1 min | Sliding window |
| API (agent, burst) | API key `short_token` | 30 req | 1 sec | Token bucket |
| API (browser user) | Supabase session ID | 100 req | 1 min | Sliding window |
| Push notifications | User ID | 50 notifs | 1 hour | Fixed window |

**Response Headers (on every response):**

```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 423
X-RateLimit-Reset: 1707782400
Retry-After: 30          (only on 429 responses)
```

**New Environment Variables:**

```
UPSTASH_REDIS_REST_URL=        (Supabase project secrets, non-sensitive)
UPSTASH_REDIS_REST_TOKEN=      (Supabase project secrets, Sensitive)
```

**Acceptance Criteria:**
- [ ] Upstash Redis provisioned and accessible via REST API from Edge Functions
- [ ] Unauthenticated requests are rate-limited at the Edge (before compute)
- [ ] Agent requests are rate-limited per API key
- [ ] 429 responses include `Retry-After` header
- [ ] Rate limit headers present on every response
- [ ] Auth endpoints (login, token exchange) have aggressive limits (5 req/15 min per IP)

---

### 0.4 — Security Hardening Checklist

These apply to the entire agent API surface and should be verified before Phase 1 is considered complete.

**OWASP API Top 10 Mitigations:**

| Risk | Mitigation | Implementation |
|------|-----------|----------------|
| **Broken Object-Level Authorization (BOLA)** | RLS on every agent-facing table. Never trust client-supplied IDs without RLS. | Verify all new tables have RLS enabled. Use `/functions/v1/my-*` patterns instead of `/functions/v1/users/{id}/*` |
| **Injection** | Parameterized queries only. Validate all inputs with Zod schemas. | Add Zod validation to every agent Edge Function. Never interpolate agent input into SQL or Supabase `.filter()` |
| **Broken Authentication** | API key system (0.1) + rate limiting (0.3) | Monitor for keys in public repos via GitHub secret scanning on `wab_live_` prefix |
| **Excessive Data Exposure** | Explicit `.select()` on every query. Never return `SELECT *`. | Create Supabase views for agent-facing data that exclude sensitive columns |
| **Mass Assignment** | Zod schemas in `strict()` mode. Reject unknown properties. | Apply to all POST/PATCH agent Edge Functions |
| **SSRF** | Never fetch arbitrary URLs from agent input. Allowlist if needed. | Block internal IP ranges (10.x, 172.16.x, 192.168.x, 169.254.x) |
| **Security Misconfiguration** | Strict CORS (only your domains, not `*`). Disable REST API for sensitive tables. | Audit Supabase dashboard settings. `REVOKE` anon access on agent tables |

**Agent-Specific RLS Pattern:**

```sql
-- Differentiate agent vs. human access in RLS policies
CREATE POLICY "agent_read_events" ON agent_events
  FOR SELECT USING (
    auth.uid() = user_id
    AND (
      auth.jwt()->>'agent' IS NULL              -- human user (browser)
      OR auth.jwt()->>'agent' = 'true'          -- authenticated agent
    )
  );
```

**Secrets Inventory:**

| Secret | Config Location | Sensitive? |
|--------|----------------|-----------|
| `API_KEY_HMAC_PEPPER` | Supabase project secrets | Yes |
| `UPSTASH_REDIS_REST_URL` | Supabase project secrets | No |
| `UPSTASH_REDIS_REST_TOKEN` | Supabase project secrets | Yes |
| `SUPABASE_JWT_SECRET` | Existing (verify) | Yes |
| All existing env vars | Verify | Audit |

**Acceptance Criteria:**
- [ ] RLS enabled on all new tables with policies tested via `SET ROLE`
- [ ] Zod schemas on every agent Edge Function input
- [ ] No `SELECT *` in any agent-facing query
- [ ] CORS configured to reject `*` origin
- [ ] GitHub secret scanning pattern registered for `wab_live_` prefix
- [ ] All new env vars added to Supabase project secrets with correct sensitivity flags
- [ ] `.env.sample` updated with new variable names (no values)

---

## Phase 1: Agent Data Layer

> Prerequisite: Phase 0 complete. Auth middleware and rate limiting in place.

### 1.1 — Agent Events Table + Supabase Realtime

**Deliverables:**
- `migrations/015_agent_events.sql`
- Supabase Realtime enabled on `agent_events`, `collections`, `records`, `rankings`
- `apps/wabbit/web/src/lib/realtime/supabase-realtime.ts` — subscription helpers

**Database Schema:**

```sql
CREATE TABLE agent_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'new_record', 'ranking_submitted', 'ravg_updated',
    'window_closing', 'branch_created', 'collaborator_joined',
    'agent_action'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  collection_id UUID REFERENCES collections(id),
  record_id UUID,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'system',    -- 'system', 'cron', 'agent', 'user'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_events_user_unprocessed
  ON agent_events(user_id, created_at DESC)
  WHERE processed = FALSE;

CREATE INDEX idx_agent_events_type
  ON agent_events(event_type, created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_events;

-- RLS
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_events" ON agent_events
  FOR SELECT USING (auth.uid() = user_id);

-- Only server (service role) can insert events
-- No INSERT policy for authenticated role = agents can't fabricate events
```

**Realtime Channel Design:**

```
Channel: user:{user_id}:events
  - Filter: event_type in ('new_record', 'ranking_submitted', 'ravg_updated', 'window_closing', 'collaborator_joined')
  - RLS: enforced per subscriber JWT

Channel: user:{user_id}:actions
  - Filter: source = 'agent'
  - For: UI to show agent activity in real-time
```

**Security: Channel names use UUIDs (not predictable sequential IDs) to prevent enumeration.**

**Event Generation — Wire into Application Pipeline:**

Create an `event-emitter.ts` module that generates agent events when key actions occur in the system. This emitter writes to `agent_events` whenever records are added, rankings are submitted, or RAVG scores are updated:

```
Event triggers:
  Record added to collection  → agent_events (event_type: 'new_record')
  Ranking submitted by user   → agent_events (event_type: 'ranking_submitted')
  RAVG recalculated           → agent_events (event_type: 'ravg_updated')
  Ranking window expiring     → agent_events (event_type: 'window_closing')
  Branch created              → agent_events (event_type: 'branch_created')
  Collaborator joins Wabb     → agent_events (event_type: 'collaborator_joined')

Flow:
  event-emitter.ts → agent_events table → Supabase Realtime → agents
```

**Acceptance Criteria:**
- [ ] `agent_events` table created with RLS
- [ ] Realtime enabled on `agent_events`
- [ ] `event-emitter.ts` writes to `agent_events` on record add, ranking submit, RAVG update, window close, branch create, and collaborator join
- [ ] Supabase Realtime subscription works with agent JWT (from Phase 0 token exchange)
- [ ] Events are filtered by user — agents only receive their own user's events
- [ ] No INSERT policy on `agent_events` for authenticated role (server-only writes)

---

### 1.2 — Agent Sessions Table

**Deliverables:**
- `migrations/016_agent_sessions.sql`
- Heartbeat cleanup cron (extend existing cleanup Edge Function)

**Database Schema:**

```sql
CREATE TABLE agent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  api_key_id UUID REFERENCES agent_api_keys(id),
  agent_type TEXT NOT NULL CHECK (agent_type IN (
    'openclaw', 'claude_code', 'cloud_worker', 'custom'
  )),
  platform TEXT,                             -- 'whatsapp', 'telegram', 'slack', 'web'
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_agent_sessions_user_active
  ON agent_sessions(user_id)
  WHERE status = 'connected';

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_sessions" ON agent_sessions
  FOR SELECT USING (auth.uid() = user_id);
```

**Stale Session Cleanup:**

Add to existing daily cleanup Edge Function:
- Mark sessions as `disconnected` if `last_heartbeat` is older than 10 minutes
- Delete disconnected sessions older than 30 days

**Connection Limits:**

| Limit | Value | Enforcement |
|-------|-------|-------------|
| Max concurrent sessions per user | 10 | Check on session creation |
| Max concurrent sessions per API key | 5 | Check on session creation |
| Heartbeat interval | 30 seconds | Agent-side responsibility |
| Stale threshold | 10 minutes | Server-side cleanup |

**Acceptance Criteria:**
- [ ] `agent_sessions` table created with RLS
- [ ] Session created when agent connects via `/functions/v1/agent-events`
- [ ] Session heartbeat updated on each agent request
- [ ] Stale sessions cleaned up by daily cron
- [ ] Connection limit enforced (reject with 429 if exceeded)

---

### 1.3 — Agent API Routes (Edge Functions)

**Deliverables:**
- `supabase/functions/agent-events/index.ts` — SSE endpoint
- `supabase/functions/agent-actions/index.ts` — agent action endpoint
- `supabase/functions/agent-token/index.ts` — JWT minting

**`GET /functions/v1/agent-events` — Server-Sent Events Stream:**

```
Request:
  Authorization: Bearer wab_live_...
  Accept: text/event-stream

Response (SSE stream):
  event: new_record
  data: {"collection_id": "uuid", "record_id": "uuid", "content_type": "image", "title": "Generated landscape #42", ...}

  event: ranking_submitted
  data: {"collection_id": "uuid", "record_id": "uuid", "score": 8, "ranker": "user_name", ...}

  event: ravg_updated
  data: {"collection_id": "uuid", "record_id": "uuid", "old_ravg": 7.2, "new_ravg": 7.5, ...}

  event: heartbeat
  data: {"ts": 1707782400}
```

Implementation:
1. Validate API key via agent-auth middleware
2. Check `subscribe:realtime` scope
3. Create/update agent session
4. Open SSE connection
5. Subscribe to Supabase Realtime for `agent_events WHERE user_id = auth_user`
6. Forward events as SSE messages
7. Send heartbeat every 30 seconds
8. Clean up session on disconnect

**`POST /functions/v1/agent-actions` — Agent Write Actions:**

```
Request:
  Authorization: Bearer wab_live_...
  Content-Type: application/json
  {
    "action": "submit_ranking",
    "record_id": "uuid",
    "collection_id": "uuid",
    "score": 8
  }

Response:
  { "success": true, "action": "submit_ranking", "record_id": "uuid", "collection_id": "uuid" }
```

Supported actions:

| Action | Required Scope | Description |
|--------|---------------|-------------|
| `submit_ranking` | `write:rankings` | Submit a score for a record in a collection |
| `create_collection` | `write:collections` | Create a new Wabb (collection) |
| `dismiss_notification` | `write:notifications` | Mark notification as read |
| `dismiss_all_notifications` | `write:notifications` | Mark all notifications as read |

**Input Validation (Zod):**

Every action payload validated with strict Zod schema. Unknown fields rejected.

```typescript
const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('submit_ranking'),
    record_id: z.string().uuid(),
    collection_id: z.string().uuid(),
    score: z.number().min(1).max(10)
  }),
  z.object({
    action: z.literal('create_collection'),
    name: z.string().min(1).max(200),
    content_type: z.enum(['image', 'video', 'text', '3d', 'audio', 'deck']),
    ranking_mode: z.enum(['swipe', 'slider', 'grid', 'tournament'])
  }),
  z.object({ action: z.literal('dismiss_notification'), notification_id: z.string().uuid() }),
  z.object({ action: z.literal('dismiss_all_notifications') }),
]).strict();
```

**`POST /functions/v1/agent-token` — JWT Minting:**

See Phase 0.2 for details. Returns short-lived Supabase JWT for Realtime access.

**Acceptance Criteria:**
- [ ] SSE endpoint streams events in real-time when Supabase Realtime fires
- [ ] SSE connection respects API key scopes
- [ ] SSE sends heartbeat every 30 seconds
- [ ] Agent session tracked in `agent_sessions` table
- [ ] Actions endpoint validates input with Zod strict schemas
- [ ] Each action checks required scope before executing
- [ ] Agent-token endpoint returns valid 15-minute JWT
- [ ] All routes return consistent error format: `{ "error": "message", "code": "ERROR_CODE" }`
- [ ] All routes log to existing audit system

---

## Phase 2: OpenClaw Integration

> Prerequisite: Phase 1 complete. Agent API routes functional.
> Separate repo: `github.com/yourorg/wabbit-openclaw-skills`

### 2.1 — Wabbit Skill Pack

**Deliverables:**
- Separate git repo: `wabbit-openclaw-skills/`
- 6 skills + manifest

**Repo Structure:**

```
wabbit-openclaw-skills/
├── SKILL.md                   # OpenClaw skill manifest
├── skills/
│   ├── search-wabbs.md        # Search collections by criteria
│   ├── rank-record.md         # Score a record in a Wabb
│   ├── my-progress.md         # Show ranking progress across Wabbs
│   ├── get-leaderboard.md     # Show top records by RAVG
│   ├── wabb-detail.md         # Full Wabb details (team, records, RAVG config)
│   └── digest.md              # Daily/weekly ranking activity summary
├── setup/
│   ├── configure.md           # Setup instructions for users
│   └── api-key-setup.md       # How to get a Wabbit API key
├── README.md
└── LICENSE
```

**SKILL.md Manifest:**

```markdown
# Wabbit Content Ranking Skills

Connect your OpenClaw agent to Wabbit (wabbit.ai) for gesture-driven
content ranking, async collaboration, and consensus scoring via RAVG.

## Setup

1. Log in to wabbit.ai
2. Go to Settings → Agent API Keys
3. Create a new key with desired scopes
4. Set environment variable: WABBIT_API_KEY=wab_live_...
5. Set environment variable: WABBIT_API_URL=https://wabbit.ai

## Skills

- search-wabbs: Search collections by output type, ranking mode, progress status
- rank-record: Submit a score for a record in a Wabb
- my-progress: Show your ranking progress across all Wabbs
- get-leaderboard: Show top records by RAVG score
- wabb-detail: Get full Wabb details including team, records, and RAVG config
- digest: Generate a daily/weekly summary of ranking activity
```

**Skill Example — `search-wabbs.md`:**

```markdown
# Search Wabbs

Search Wabbit for collections (Wabbs) matching criteria.

## When to use
User asks about their Wabbs, collections, content to rank, or wants to find specific ranking sessions.

## How to execute
1. Extract search criteria from user message:
   - content_type (string: image, video, text, 3d, audio, deck)
   - ranking_mode (string: swipe, slider, grid, tournament)
   - status (string: active, completed, pending)
   - name (string, partial match)
2. Call the Wabbit API:
   GET {WABBIT_API_URL}/functions/v1/agent-actions?action=search_wabbs&content_type={content_type}&status={status}
   Authorization: Bearer {WABBIT_API_KEY}
3. Format results as a numbered list with: name, content type, ranking mode, progress, RAVG range, collaborator count
4. If no results, suggest broadening criteria.

## Example interaction
User: "What Wabbs need my rankings?"
Agent: Calls my-progress skill
Agent: "You have 3 Wabbs with unfinished rankings:
  1. Logo Concepts v2 — Image — Swipe mode — 4/12 ranked — RAVG: 6.8
  2. Podcast Intros — Audio — Slider mode — 0/8 ranked — Not started
  3. Landing Page Copy — Text — Grid mode — 7/10 ranked — RAVG: 7.4"
```

**Skill Example — `rank-record.md`:**

```markdown
# Rank Record

Submit a score for a record in a Wabb.

## When to use
User wants to score, rate, or rank a specific piece of content in a Wabb.

## How to execute
1. Extract from user message:
   - record identifier (name or ID)
   - score (number, typically 1-10)
   - collection context (which Wabb, if ambiguous)
2. Call the Wabbit API:
   POST {WABBIT_API_URL}/functions/v1/agent-actions
   Authorization: Bearer {WABBIT_API_KEY}
   Body: { "action": "submit_ranking", "record_id": "uuid", "collection_id": "uuid", "score": 8 }
3. Confirm the ranking was submitted and show updated RAVG if available.

## Example interaction
User: "Score it an 8"
Agent: Calls submit_ranking with score 8 for the contextual record
Agent: "Done! Scored 'Sunset Render #7' an 8 in Logo Concepts v2. Updated RAVG: 7.6 (was 7.2)."
```

**Acceptance Criteria:**
- [ ] All 6 skills documented with clear trigger conditions and API call patterns
- [ ] SKILL.md manifest follows OpenClaw skill discovery format
- [ ] Setup instructions cover API key creation and environment variable config
- [ ] Skills handle error cases (API down, invalid key, rate limited, no results)
- [ ] README includes installation instructions (git clone + copy to `~/.openclaw/workspace/skills/`)

---

### 2.2 — End-to-End Notification Loop Test

**Test Scenario:**

```
1. New record added to a collection
   ↓
2. event-emitter.ts detects new record, writes to agent_events
   ↓
3. Supabase Realtime broadcasts to subscribed agents
   ↓
4. OpenClaw (running locally) receives event via SSE
   ↓
5. OpenClaw formats notification using wabb-detail skill context
   ↓
6. OpenClaw delivers to user via configured channel (WhatsApp/Telegram/Slack)
   ↓
7. User responds "Score it an 8"
   ↓
8. OpenClaw calls POST /functions/v1/agent-actions { action: "submit_ranking", record_id: "...", collection_id: "...", score: 8 }
   ↓
9. Ranking submitted, RAVG recalculated, updated in Wabbit app immediately (Realtime sync)
```

**Acceptance Criteria:**
- [ ] Full loop works end-to-end with OpenClaw running locally
- [ ] Notification arrives within 5 seconds of new record being added
- [ ] User can take action (rank/dismiss) via messaging platform
- [ ] Action is reflected in Wabbit web app immediately (Realtime sync)
- [ ] Rate limiting works — agent is throttled if it exceeds limits
- [ ] Revoked API key immediately stops the notification stream

---

### 2.3 — ClawHub Registration (Optional)

**Deliverables:**
- Register `wabbit` skill pack on ClawHub for auto-discovery
- Users can install via OpenClaw's skill management

**Acceptance Criteria:**
- [ ] Skill pack discoverable via ClawHub search
- [ ] Install flow works: user runs install command, skills appear in workspace

---

## Phase 3: MCP Server

> Prerequisite: Phase 1 complete. Agent API routes functional.
> Separate repo: `github.com/yourorg/wabbit-mcp-server`
> Published to npm as `wabbit-mcp-server`

### 3.1 — MCP Server Core

**Deliverables:**
- Separate git repo: `wabbit-mcp-server/`
- Published npm package
- 7 MCP tools

**Repo Structure:**

```
wabbit-mcp-server/
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── auth.ts                     # API key validation
│   ├── tools/
│   │   ├── search-wabbs.ts         # wabbit_search_wabbs
│   │   ├── get-wabb.ts             # wabbit_get_wabb
│   │   ├── get-records.ts          # wabbit_get_records
│   │   ├── submit-ranking.ts       # wabbit_submit_ranking
│   │   ├── get-leaderboard.ts      # wabbit_get_leaderboard
│   │   ├── get-progress.ts         # wabbit_get_progress
│   │   └── create-wabb.ts          # wabbit_create_wabb
│   └── validation/
│       ├── schemas.ts              # Zod schemas for all tool inputs
│       └── sanitize.ts             # Output sanitization
├── package.json
├── tsconfig.json
└── README.md
```

**MCP Tool Definitions:**

| Tool | Scopes Required | Read/Write | Description |
|------|----------------|------------|-------------|
| `wabbit_search_wabbs` | `read:collections` | Read | Search collections by content type, ranking mode, status |
| `wabbit_get_wabb` | `read:collections` | Read | Full details for one Wabb (team, records, RAVG config) |
| `wabbit_get_records` | `read:records` | Read | List records in a collection with scores |
| `wabbit_submit_ranking` | `write:rankings` | Write | Submit a score for a record |
| `wabbit_get_leaderboard` | `read:records` | Read | Top records by RAVG across collections |
| `wabbit_get_progress` | `read:collections` | Read | User's ranking progress across all Wabbs |
| `wabbit_create_wabb` | `write:collections` | Write | Create a new collection |

**Usage (in `.claude/.mcp.json`):**

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

### 3.2 — MCP Security

**Input Validation (pre-call):**
- Every tool argument validated against strict Zod schema
- Reject unexpected fields
- Sanitize strings: strip control characters, limit length (1000 chars max)
- Collection and record IDs must be valid UUIDs
- Scores must be positive numbers within valid range (1-10)
- Content type names: must match valid enum values (image, video, text, 3d, audio, deck)

**Output Sanitization (post-call):**
- Strip content that could be interpreted as prompt injection (e.g., text containing "ignore previous instructions")
- Redact PII from tool results: mask phone numbers, email addresses
- Cap output size at 4,000 tokens to prevent context stuffing
- Never include internal IDs, database column names, or error stack traces

**Least Privilege:**
- MCP server connects via API key with minimal scopes
- Read-only tools use read-only scopes
- Write tools require explicit write scopes
- Tool descriptions hardcoded server-side (never loaded from external sources)

**Human-in-the-Loop:**
- `wabbit_submit_ranking` with scope `write:rankings` requires explicit user opt-in during API key creation
- `wabbit_create_wabb` with scope `write:collections` requires explicit user opt-in during API key creation
- Destructive actions (if any added later) require approval queue

**Acceptance Criteria:**
- [ ] All 7 tools functional and tested
- [ ] Published to npm, installable via `npx -y wabbit-mcp-server`
- [ ] Works from Claude Code: can query collections, read records, submit rankings
- [ ] Input validation rejects malformed inputs with clear error messages
- [ ] Output sanitization strips PII and potential injection content
- [ ] README includes setup instructions and security model description
- [ ] No hardcoded API keys or URLs in the package

---

## Phase 4: PWA + Mobile

> Prerequisite: Phase 1 complete (Realtime enabled for push trigger).

### 4.1 — PWA Manifest + Service Worker

**Deliverables:**
- PWA configuration via `vite-plugin-pwa` (already configured in build plan)
- `apps/wabbit/web/public/manifest.json`
- `apps/wabbit/web/src/sw.ts` — custom service worker logic (registered via vite-plugin-pwa)
- App icons (192x192, 512x512)

**manifest.json:**

```json
{
  "name": "Wabbit — Gesture-driven content ranking with async collaboration",
  "short_name": "Wabbit",
  "description": "Rank AI-generated content with gestures, collaborate async, reach consensus via RAVG",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Service Worker Scope:**
- Cache: static assets, app shell, recently viewed records and collection metadata
- Network-first strategy for API calls
- Stale-while-revalidate for record thumbnails and content previews
- Do NOT cache agent API routes or auth endpoints

**Acceptance Criteria:**
- [ ] App installable from Chrome/Safari "Add to Home Screen"
- [ ] Offline: shows cached collection and record data with "offline" indicator
- [ ] Service worker caches app shell and static assets
- [ ] API calls fall back gracefully when offline

---

### 4.2 — Web Push Notifications

**Deliverables:**
- `supabase/functions/_shared/push/vapid.ts` — VAPID key management
- `apps/wabbit/web/src/lib/push/subscribe.ts` — client-side subscription
- `supabase/functions/push-send/index.ts` — server-side push sending Edge Function
- `supabase/functions/push-subscribe/index.ts` — subscription endpoint
- `migrations/017_push_subscriptions.sql`

**VAPID Key Management:**

- Generate keys once: `npx web-push generate-vapid-keys`
- `VAPID_PRIVATE_KEY` → Supabase project secrets (Sensitive)
- `VAPID_PUBLIC_KEY` → Supabase project secrets (non-sensitive, safe for client)
- `VAPID_SUBJECT` → `mailto:push@wabbit.ai`
- Never rotate VAPID keys unless compromised (invalidates all subscriptions)

**Push Subscription Storage:**

```sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,            -- client public key
  auth TEXT NOT NULL,              -- client auth secret
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_subs" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

**Subscription Endpoint Validation:**
- Validate `endpoint` is HTTPS
- Validate `endpoint` domain is a known push service (`fcm.googleapis.com`, `updates.push.services.mozilla.com`, `wns.windows.com`)
- On `410 Gone` or `404` from push service: delete stale subscription immediately

**Push Payload Security:**
- Payloads encrypted end-to-end via RFC 8291 (handled by `web-push` npm)
- Max plaintext: 3,993 bytes — send trigger only, not full data
- Never include tokens, API keys, or full PII in push payloads

**Push Notification Triggers:**

| Trigger | Event Type | Payload Example |
|---------|-----------|-----------------|
| New record added to collection | `new_record` | `{ "type": "new_record", "collection_id": "uuid", "title": "New content added!", "body": "3 new images in Logo Concepts v2" }` |
| RAVG threshold reached | `ravg_updated` | `{ "type": "ravg_updated", "collection_id": "uuid", "title": "Consensus reached!", "body": "Logo #4 hit RAVG 8.5 in Logo Concepts v2" }` |
| Ranking window closing | `window_closing` | `{ "type": "window_closing", "collection_id": "uuid", "title": "Window closing soon!", "body": "2 hours left to rank in Podcast Intros" }` |
| Collaborator joined | `collaborator_joined` | `{ "type": "collaborator_joined", "collection_id": "uuid", "title": "New collaborator!", "body": "Alex joined Logo Concepts v2" }` |

**New Environment Variables:**

```
VAPID_PUBLIC_KEY=        (Supabase project secrets, non-sensitive)
VAPID_PRIVATE_KEY=       (Supabase project secrets, Sensitive)
VAPID_SUBJECT=           (Supabase project secrets, non-sensitive)
```

**Acceptance Criteria:**
- [ ] User can enable push notifications from Settings
- [ ] Browser permission prompt shown and subscription stored
- [ ] Push notification received when a new record is added to a collection
- [ ] Push notification received when RAVG threshold is reached
- [ ] Push notification received when a ranking window is about to close
- [ ] Push notification received when a collaborator joins a Wabb
- [ ] Clicking notification opens the relevant collection/record in the app
- [ ] Stale subscriptions cleaned up on push failure
- [ ] Push works on Chrome, Firefox, Safari, and mobile browsers
- [ ] VAPID private key stored as Sensitive in Supabase project secrets

---

## Phase 5: Scale + Monitoring

> Prerequisite: Phases 1-4 functional. System under real user load.

### 5.1 — Inngest Event Functions

> **Important:** Inngest event functions run in Supabase Edge Functions (Deno), NOT in the Vite SPA client. The SPA is a static client that never executes background jobs or event processing.

**Deliverables:**
- `supabase/functions/_shared/inngest/client.ts` — Inngest client
- `supabase/functions/inngest-handler/index.ts` — Inngest serve endpoint (Edge Function)
- Event function definitions within the inngest handler

**Replace Cron fan-out with Inngest:**

Current: Cron → single function processes all users sequentially
Proposed: Cron → triggers Inngest event → Inngest fans out to per-user functions with concurrency control

**Event Functions:**

| Function | Trigger | Concurrency | Description |
|----------|---------|-------------|-------------|
| `record/added` | Record insert | 10 parallel | Fan out to team notifications — notify all collaborators on the Wabb |
| `ranking/submitted` | Ranking insert | 10 parallel | Recalculate RAVG for the record and collection |
| `window/expiring` | Cron (hourly check) | 5 parallel | Notify collaborators with unfinished rankings before window closes |
| `system/cleanup.daily` | Cron (3am) | 1 | Stale sessions, expired keys, old events |

**Inngest Security:**
- `INNGEST_SIGNING_KEY` validates webhook payloads (HMAC-SHA256, handled by SDK)
- `INNGEST_SIGNING_KEY_FALLBACK` for zero-downtime key rotation
- Never include secrets in event payloads — pass IDs only, fetch data inside functions
- Use `@inngest/middleware-encryption` if event payloads contain PII

**New Environment Variables:**

```
INNGEST_SIGNING_KEY=         (Supabase project secrets, Sensitive)
INNGEST_SIGNING_KEY_FALLBACK= (Supabase project secrets, Sensitive, for rotation)
INNGEST_EVENT_KEY=           (Supabase project secrets, Sensitive)
```

**Acceptance Criteria:**
- [ ] Inngest dev server works locally (`npx inngest-cli@latest dev`)
- [ ] `record/added` triggers fan-out to notify all Wabb collaborators
- [ ] `ranking/submitted` triggers RAVG recalculation
- [ ] `window/expiring` sends reminders to collaborators with pending rankings
- [ ] Notifications sent in parallel with concurrency limits
- [ ] Failed functions retry with backoff (Inngest default: 3 retries)
- [ ] Inngest dashboard shows function execution history
- [ ] Signing key validates all webhook payloads

---

### 5.2 — Connection Pooling Optimization

**Deliverables:**
- Verify `?pgbouncer=true` on all Supabase connection strings
- Separate connection strings for different workloads

**Connection Strategy:**

| Workload | Connection Type | Pool Mode |
|----------|----------------|-----------|
| Edge Functions (short queries) | Pooled (`?pgbouncer=true`) | Transaction mode |
| Realtime subscriptions | Direct (non-pooled) | Session mode |
| Inngest functions | Pooled | Transaction mode |
| Migrations | Direct | Session mode |

**Acceptance Criteria:**
- [ ] All Edge Functions use pooled connection
- [ ] Realtime uses direct connection
- [ ] No connection leaks under load (verify in Supabase dashboard)

---

### 5.3 — Monitoring Dashboard

**Deliverables:**
- `apps/wabbit/web/src/pages/admin/agents.tsx` — agent monitoring page
- Extend existing admin Edge Functions with agent metrics

**Dashboard Metrics:**

| Metric | Source | Display |
|--------|--------|---------|
| Active agent sessions | `agent_sessions` WHERE status = 'connected' | Count + list |
| Events generated (24h) | `agent_events` WHERE created_at > now() - 24h | Count by type |
| API key usage | `agent_api_keys` last_used_at | Table with usage frequency |
| Rate limit hits (24h) | Upstash Redis | Count |
| Push notification delivery rate | `push_subscriptions` + send logs | Success % |
| SSE connections active | In-memory counter | Gauge |
| Inngest function health | Inngest API | Success/failure/retry counts |

**Acceptance Criteria:**
- [ ] Admin can view all active agent sessions
- [ ] Admin can revoke any API key from the dashboard
- [ ] Metrics update in real-time (Supabase Realtime on admin tables)
- [ ] Alert on: >50% rate limit hits, >10% push failures, stale sessions spike

---

## New Environment Variables Summary

All new variables across all phases:

| Variable | Phase | Sensitive | Description |
|----------|-------|-----------|-------------|
| `API_KEY_HMAC_PEPPER` | 0 | Yes | Pepper for API key HMAC hashing |
| `UPSTASH_REDIS_REST_URL` | 0 | No | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | 0 | Yes | Upstash Redis auth token |
| `SUPABASE_JWT_SECRET` | 0 | Yes | For minting agent JWTs (may already exist) |
| `VAPID_PUBLIC_KEY` | 4 | No | Web Push public key (safe for client) |
| `VAPID_PRIVATE_KEY` | 4 | Yes | Web Push private key |
| `VAPID_SUBJECT` | 4 | No | Web Push contact email |
| `INNGEST_SIGNING_KEY` | 5 | Yes | Inngest webhook signature validation |
| `INNGEST_SIGNING_KEY_FALLBACK` | 5 | Yes | For zero-downtime key rotation |
| `INNGEST_EVENT_KEY` | 5 | Yes | Inngest event sending key |

---

## New Database Migrations Summary

| Migration | Phase | Table | Description |
|-----------|-------|-------|-------------|
| `014_agent_api_keys.sql` | 0 | `agent_api_keys` | API key storage with scopes |
| `015_agent_events.sql` | 1 | `agent_events` | Event stream for agents |
| `016_agent_sessions.sql` | 1 | `agent_sessions` | Active connection tracking |
| `017_push_subscriptions.sql` | 4 | `push_subscriptions` | Web Push subscription storage |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API key leak in public repo | Medium | High | Prefix pattern (`wab_live_`) enables GitHub secret scanning. Immediate revocation via dashboard. |
| Prompt injection via MCP tool results | Medium | High | Output sanitization, PII redaction, size caps. Input validation with strict Zod schemas. |
| Supabase Realtime connection exhaustion | Low | High | Max 10 sessions/user. Stale session cleanup. Monitor in admin dashboard. |
| Agent writes malicious data via actions endpoint | Low | Medium | Zod strict validation. RLS. Scoped permissions. Audit logging. |
| VAPID key compromise | Low | High | Stored as Sensitive in Supabase project secrets. Rotation invalidates all subscriptions — document recovery procedure. |
| Inngest event replay attack | Low | Medium | SDK validates timestamp (5-min window). Idempotency via event ID dedup. |
| OpenClaw skill impersonation | Low | Medium | Skills only work with valid API key. Key is per-user, scoped. Revocable. |
| Rate limit bypass via distributed agents | Low | Low | Per-key limits (not just per-IP). Anomaly detection on usage patterns. |

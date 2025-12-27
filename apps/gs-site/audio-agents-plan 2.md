# Audio Agents Implementation Plan

**Created:** December 26, 2025
**Last Updated:** December 26, 2025
**Status:** Phase 0 In Progress
**Branch:** `gssite-dec18-per-notion`

---

## Vision

Transform the 14 AI agent personas defined in `agent-team/agent-team-12.25.md` into voice-enabled agents capable of handling real phone calls for real estate operations.

---

## Progress Summary

| Phase | Name | Status | Progress | Est. Days |
|-------|------|--------|----------|-----------|
| Pre | Research & Planning | ✅ Complete | 4/4 | - |
| 0 | Foundation | ✅ Complete | 11/11 | 1 |
| 1 | Single Agent MVP | 🟡 In Progress | 8/12 | 4 |
| 2 | Recording Pipeline | ⬜ Not Started | 0/5 | 1.5 |
| 3 | Multi-Agent Routing | ⬜ Not Started | 0/6 | 3 |
| 4 | OpenRouter Integration | ⬜ Not Started | 0/9 | 3 |
| 5 | Warm Transfer + Voicemail | ⬜ Not Started | 0/10 | 2.5 |
| 6 | Dashboard Integration | ⬜ Not Started | 0/5 | 1.5 |

**Total Effort:** ~16.5 engineering days (revised from 10)

---

## Pre-Phase: Research & Planning ✅

- [x] Deep research on voice AI platforms (10+ evaluated)
- [x] Document research findings → `VOICE_AI_RESEARCH_v2.md`
- [x] Create implementation plan → `audio-agents-plan.md`
- [x] Design Supabase schema → `supabase/migrations/20251226_create_voice_tables.sql`

**Decision:** Retell AI selected as primary platform (best warm transfer + docs + Vercel compatibility)

---

## Critical Infrastructure Requirements

### 🔴 Webhook Security & Reliability

**Problem:** Retell sends webhooks once. If handler fails, data is lost forever.

**Required Components:**

1. **Signature Verification** - Validate `X-Retell-Signature` header
2. **Idempotency** - Use `external_call_id` to prevent duplicate processing
3. **Dead Letter Queue** - Store failed webhooks for retry
4. **Retry Logic** - Exponential backoff for transient failures

**Implementation:**

```typescript
// lib/voice/webhook-security.ts
import crypto from 'crypto';

export function verifyRetellSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

**Database Table (add to migration):**

```sql
CREATE TABLE IF NOT EXISTS voice_webhook_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    external_call_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_queue_status ON voice_webhook_queue(status, next_retry_at)
    WHERE status IN ('pending', 'failed');
CREATE UNIQUE INDEX idx_webhook_queue_idempotency ON voice_webhook_queue(external_call_id, webhook_type);
```

---

### 🔴 Provider Abstraction Layer

**Problem:** Tight coupling to Retell = no escape if issues arise.

**Required Structure:**

```
lib/voice/
├── providers/
│   ├── interface.ts          # Abstract VoiceProvider interface
│   ├── retell/
│   │   ├── client.ts         # Retell-specific implementation
│   │   ├── webhooks.ts       # Retell webhook parsing
│   │   └── types.ts          # Retell-specific types
│   └── pipecat/              # Future: Pipecat implementation
│       └── client.ts
├── client.ts                 # Factory: returns provider based on config
├── types.ts                  # Provider-agnostic types
└── webhook-security.ts       # Signature verification
```

**Interface:**

```typescript
// lib/voice/providers/interface.ts
export interface VoiceProvider {
  name: string;

  // Agent management
  createAgent(config: AgentConfig): Promise<string>;
  updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<void>;

  // Call operations
  initiateCall(params: OutboundCallParams): Promise<CallResult>;
  transferCall(callId: string, target: TransferTarget): Promise<void>;
  endCall(callId: string): Promise<void>;

  // Data retrieval
  getCall(callId: string): Promise<CallDetails>;
  getRecordingUrl(callId: string): Promise<string>;

  // Webhook parsing
  parseWebhook(payload: unknown): ParsedWebhookEvent;
}
```

---

### 🔴 Model Tier Optimization

**Problem:** All agents using claude-3.5-sonnet wastes 80%+ on simple tasks.

**Solution:** Agent-appropriate model selection.

| Agent | Role | Model | Rationale |
|-------|------|-------|-----------|
| Morgan | Reception | `claude-3-haiku` | Simple routing, message taking |
| Emily Liu | EA | `claude-3-haiku` | Similar to Morgan |
| Noah Carter | Sales | `claude-3.5-sonnet` | Needs persuasion, nuance |
| Kyle Blonkosky | Coach | `claude-3-haiku` | Accountability check-ins |
| Victoria Chen | Research | `claude-3.5-sonnet` | Complex analysis |
| Daniel Park | Technical | `gpt-4o-mini` | Technical accuracy |

**Cost Savings:** ~$0.015/1K → ~$0.00025/1K for haiku = **98% reduction** on simple calls.

**Update to voice_agents table:**

```sql
-- Add model tier column
ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS model_tier TEXT
    DEFAULT 'standard' CHECK (model_tier IN ('economy', 'standard', 'premium'));

-- Update existing agents
UPDATE voice_agents SET model_tier = 'economy', model_primary = 'anthropic/claude-3-haiku'
    WHERE name IN ('Morgan', 'Emily Liu', 'Kyle Blonkosky');
UPDATE voice_agents SET model_tier = 'premium', model_primary = 'anthropic/claude-3.5-sonnet'
    WHERE name IN ('Noah Carter', 'Victoria Chen');
```

---

## Phase 0: Foundation 🟡

### Checklist

- [x] Create Supabase migration file
- [x] Run Supabase migration on database
- [x] Create `voice-recordings` storage bucket in Supabase ← **DONE 2025-12-26**
- [x] Generate webhook secret ← **DONE 2025-12-26**
- [x] Add environment variables to `.env.local` ← **DONE 2025-12-26**
- [x] Install ngrok for local webhook testing ← **DONE 2025-12-26**
- [x] Create Retell AI account (production) ← **DONE 2025-12-26**
- [x] Create Morgan agent in Retell ← **DONE 2025-12-26** (agent_942ffec123c3236d315e55a9a4)
- [x] Provision production phone number (623) ← **DONE 2025-12-26** (+1 623-323-6043)
- [ ] Create Retell AI account (staging/test) ← *Optional*
- [ ] Provision staging phone number (any area code) ← *Optional*
- [ ] Add Retell env vars to Vercel

### Environment Variables Needed

```bash
# Retell AI - Production
RETELL_API_KEY=                    # Get from Retell dashboard
RETELL_PHONE_NUMBER=               # Provisioned number in E.164 format

# Retell AI - Staging (NEW)
RETELL_STAGING_API_KEY=            # Separate staging account
RETELL_STAGING_PHONE_NUMBER=       # Staging phone number
RETELL_STAGING_AGENT_ID=           # Test agent for development

# OpenRouter (for Phase 4)
OPENROUTER_API_KEY=                # Already have this

# Webhook verification
RETELL_WEBHOOK_SECRET=             # Generate: openssl rand -hex 32

# Monitoring (NEW)
SENTRY_DSN=                        # Error tracking
SLACK_WEBHOOK_URL=                 # Alerts for failures
```

### Staging Environment Setup ← **NEW**

**Purpose:** Test without risking production phone number or costs.

1. **Separate Retell Account:**
   - Create second account with different email
   - Provision cheap test phone number
   - Configure test agent with same prompts

2. **Local Development:**
   ```bash
   # Install ngrok for webhook testing
   npm install -g ngrok

   # Start tunnel
   ngrok http 3003

   # Configure Retell webhook to ngrok URL
   # https://xxxx.ngrok.io/api/voice/webhooks/retell
   ```

3. **Test Call API:**
   ```typescript
   // Use Retell's test call feature
   const testCall = await retell.createTestCall({
     agent_id: process.env.RETELL_STAGING_AGENT_ID,
     // Simulates inbound call without real phone
   });
   ```

### Files Created

- [x] `supabase/migrations/20251226_create_voice_tables.sql`
  - Tables: `voice_agents`, `voice_calls`, `voice_turns`, `voice_transcripts`, `voice_recordings`, `voice_tool_events`, `voice_phone_numbers`, `voice_call_analytics`
  - Includes: indexes, RLS policies, triggers, seed data for 5 agents
  - Includes: helper functions `get_voice_call_stats()`, `get_recent_voice_calls()`

### Commands to Run

```bash
# Apply migration (after Retell account setup)
npx supabase db push

# Or via Supabase dashboard: SQL Editor → paste migration

# Generate webhook secret
openssl rand -hex 32
```

---

## Phase 1: Single Agent MVP 🟡

### Goal
Morgan (Executive Assistant) handles inbound calls, answers basic questions, takes messages.
**With production-grade webhook handling and error recovery.**

### Checklist

**Agent Setup:**
- [x] Create Morgan agent in Retell dashboard ← **DONE 2025-12-26**
  - [x] Select voice (GPT-4o Mini Realtime)
  - [x] Configure system prompt
  - [x] Enable call recording
  - [ ] Configure LLM fallback timeout: 3 seconds

**Webhook Handler (with security):**
- [x] Implement `/api/voice/webhooks/retell` webhook handler ← **DONE 2025-12-26**
- [x] Add signature verification using `RETELL_WEBHOOK_SECRET` ← **DONE 2025-12-26**
- [x] Add idempotency check using `external_call_id` ← **DONE 2025-12-26**
- [x] Store webhook in queue before processing ← **DONE 2025-12-26**
- [x] Implement retry logic for failed processing ← **DONE 2025-12-26**
- [ ] Add Sentry error tracking

**Data Storage:**
- [x] Store call metadata in `voice_calls` table ← **DONE 2025-12-26**
- [x] Store transcript in `voice_transcripts` table ← **DONE 2025-12-26**
- [ ] Generate call summary using haiku post-call

**Testing:**
- [ ] Configure webhook URL in Retell dashboard
- [ ] Test inbound call end-to-end
- [ ] Verify call data stored in Supabase

### API Routes to Create

```
apps/gs-site/app/api/voice/
├── webhooks/
│   └── retell/route.ts       # POST: Handle Retell webhooks (with security)
├── calls/
│   ├── route.ts              # GET: list calls, POST: initiate outbound
│   └── [callId]/route.ts     # GET: single call details
├── agents/
│   └── route.ts              # GET: list agents
└── internal/
    └── process-webhook/route.ts  # POST: Process from queue (NEW)
```

### Webhook Handler Architecture ← **NEW**

```
[Retell sends webhook]
    ↓
[/api/voice/webhooks/retell]
    ├─ Verify signature (reject if invalid)
    ├─ Check idempotency (skip if duplicate)
    ├─ Insert into voice_webhook_queue
    └─ Return 200 immediately (don't block)

[Background: Process queue]
    ├─ Read pending webhooks
    ├─ Process each (store call, transcript, etc.)
    ├─ On failure: increment attempts, schedule retry
    └─ On success: mark completed
```

### Files to Create

| File | Purpose |
|------|---------|
| `app/api/voice/webhooks/retell/route.ts` | Webhook receiver with security |
| `app/api/voice/calls/route.ts` | List/create calls |
| `app/api/voice/calls/[callId]/route.ts` | Single call details |
| `app/api/voice/agents/route.ts` | List agents |
| `lib/voice/providers/interface.ts` | Provider abstraction |
| `lib/voice/providers/retell/client.ts` | Retell implementation |
| `lib/voice/providers/retell/webhooks.ts` | Webhook parsing |
| `lib/voice/webhook-security.ts` | Signature verification |
| `lib/voice/webhook-processor.ts` | Queue processing logic |
| `lib/voice/types.ts` | TypeScript types |

---

## Phase 2: Recording Pipeline ⬜

### Goal
Own all call recordings in Supabase Storage before Retell URLs expire (24hr).

### Checklist

- [ ] Create `voice-recordings` bucket in Supabase Storage
  - [ ] Set bucket to private
  - [ ] Configure RLS for service role access
  - [ ] Set file size limit: 100MB
  - [ ] Allowed MIME types: audio/wav, audio/mpeg
- [ ] Implement `/api/voice/recordings/sync` endpoint
- [ ] Add sync call to webhook handler on `call_ended` event
- [ ] Add retry logic for failed downloads ← **NEW**
- [ ] Verify dual-channel recordings download correctly

### Files to Create

- [ ] `app/api/voice/recordings/sync/route.ts`
- [ ] `lib/voice/recording-sync.ts`

### Architecture

```
[Retell: call_ended webhook]
    ↓
[Vercel: /api/voice/webhooks/retell]
    ↓ Queue webhook for processing
[Background processor]
    ↓ Extract recording URLs
    ↓ Download from Retell signed URL (expires 24hr!)
    ↓ Retry up to 3 times if download fails
    ↓ Upload to Supabase Storage
[Supabase: voice_recordings table]
    ↓ Store path + metadata
    ↓ Update sync_status = 'uploaded'
```

---

## Phase 3: Multi-Agent Routing ⬜

### Goal
Inbound calls are routed to the appropriate AI agent based on detected intent.

### Agent Assignments

| Intent | Agent | Model Tier | Rationale |
|--------|-------|------------|-----------|
| Default/Reception | Morgan | Economy | EA handles general inquiries |
| Property Questions | Noah Carter | Premium | Marketing/sales focus |
| Scheduling | Morgan | Economy | Calendar management |
| Technical/CRM | Daniel Park | Standard | Technical support |
| Coaching/Accountability | Kyle Blonkosky | Economy | Direct, authoritative |
| Research Requests | Victoria Chen | Premium | Analytical, data-focused |

### Checklist

- [ ] Create agents in Retell dashboard:
  - [ ] Noah Carter (Marketing) - sonnet
  - [ ] Daniel Park (Technical) - gpt-4o-mini
  - [ ] Kyle Blonkosky (Coach) - haiku
  - [ ] Victoria Chen (Research) - sonnet
  - [ ] Emily Liu (EA backup) - haiku
- [ ] Select and configure voice IDs for each agent
- [ ] Update Morgan's prompt with intent detection
- [ ] Implement agent-to-agent transfer logic
- [ ] Test transfers between agents
- [ ] Verify model tier is applied correctly ← **NEW**

### Retell Agent IDs (fill in after creation)

```typescript
const AGENT_IDS = {
  morgan: '',
  emily_liu: '',
  noah_carter: '',
  daniel_park: '',
  kyle_blonkosky: '',
  victoria_chen: '',
};

const MODEL_BY_AGENT: Record<string, string> = {
  morgan: 'anthropic/claude-3-haiku',
  emily_liu: 'anthropic/claude-3-haiku',
  noah_carter: 'anthropic/claude-3.5-sonnet',
  daniel_park: 'openai/gpt-4o-mini',
  kyle_blonkosky: 'anthropic/claude-3-haiku',
  victoria_chen: 'anthropic/claude-3.5-sonnet',
};
```

---

## Phase 4: OpenRouter Integration ⬜

### Goal
Route LLM requests through OpenRouter for model flexibility and fallback.
**With circuit breaker for resilience.**

### Checklist

- [ ] Create Railway account
- [ ] Create new Railway project: `voice-llm-server`
- [ ] Implement Custom LLM WebSocket server
- [ ] Implement circuit breaker pattern ← **NEW**
- [ ] Implement health check endpoint ← **NEW**
- [ ] Deploy to Railway
- [ ] Configure Railway for auto-restart on failure ← **NEW**
- [ ] Configure Retell agents to use custom LLM endpoint
- [ ] Configure Retell fallback to built-in LLM (timeout: 5s) ← **NEW**
- [ ] Test model fallback chain (primary → gpt-4o → haiku)
- [ ] Add latency monitoring

### Circuit Breaker Pattern ← **NEW**

```typescript
// voice-llm-server/src/circuit-breaker.ts
interface CircuitBreakerConfig {
  failureThreshold: number;    // 5 failures
  resetTimeout: number;        // 30 seconds
  halfOpenRequests: number;    // 3 test requests
}

class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailure: Date | null = null;

  async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldTryHalfOpen()) {
        this.state = 'half-open';
      } else {
        return fallback();
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return fallback();
    }
  }
}
```

**Fallback Chain:**

```typescript
const FALLBACK_CHAIN = [
  'anthropic/claude-3.5-sonnet',  // Primary
  'openai/gpt-4o',                 // Fast fallback
  'anthropic/claude-3-haiku',      // Emergency (cheap, fast)
];
```

### Health Check Endpoint ← **NEW**

```typescript
// voice-llm-server/src/health.ts
app.get('/health', async (req, res) => {
  const checks = {
    openrouter: await checkOpenRouter(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    circuit: circuitBreaker.getState(),
  };

  const healthy = checks.openrouter.ok;
  res.status(healthy ? 200 : 503).json(checks);
});
```

### Infrastructure

- **Platform:** Railway (~$10/mo)
- **Endpoint:** `wss://voice-llm-server.up.railway.app/ws`
- **Health Check:** `https://voice-llm-server.up.railway.app/health`
- **Restart Policy:** Always restart on failure

### Files to Create (separate repo/folder)

```
voice-llm-server/
├── src/
│   ├── index.ts              # WebSocket server
│   ├── openrouter.ts         # OpenRouter client
│   ├── circuit-breaker.ts    # Resilience pattern (NEW)
│   ├── health.ts             # Health check endpoint (NEW)
│   ├── metrics.ts            # Latency tracking (NEW)
│   └── config.ts             # Agent configs
├── package.json
├── tsconfig.json
├── Dockerfile
└── railway.toml
```

---

## Phase 5: Warm Transfer + Voicemail ⬜

### Goal
AI agent can hand off call to human with full context summary.
**With voicemail fallback when human unavailable.**

### Checklist

**Warm Transfer:**
- [ ] Configure transfer targets in `voice_agents` table
- [ ] Implement context summarization function
- [ ] Configure Retell warm transfer with whisper
- [ ] Test warm transfer to Garrett's phone
- [ ] Log transfer events in `voice_calls` table

**Voicemail Fallback:** ← **NEW SECTION**
- [ ] Configure Retell voicemail detection
- [ ] Implement voicemail recording handler
- [ ] Store voicemail in `voice_recordings` with type='voicemail'
- [ ] Transcribe voicemail using Retell STT
- [ ] Send notification (email/SMS) with transcript
- [ ] Add `call_type` column to voice_calls: 'live' | 'voicemail'

### Transfer Flow (Updated)

```
[AI Agent detects transfer needed]
    ↓ "Let me connect you with Garrett directly"
    ↓ Retell: transfer_call API
    ↓ Ring human phone (30 second timeout)
    │
    ├─ [Human answers]
    │   ↓ Whisper: "Caller: John Smith, RE: 123 Main St property inquiry"
    │   ↓ 3-way merge or cold transfer
    │   └─ [Human takes over]
    │
    └─ [Human doesn't answer] ← NEW BRANCH
        ↓ "I'm sorry, Garrett isn't available right now."
        ↓ "Would you like to leave a voicemail?"
        ├─ [Yes] → Record voicemail → Transcribe → Notify
        └─ [No] → "I'll make sure he gets your message. Goodbye."
```

### Voicemail Schema Addition ← **NEW**

```sql
-- Add voicemail support
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS call_type TEXT
    DEFAULT 'live' CHECK (call_type IN ('live', 'voicemail', 'missed'));

ALTER TABLE voice_recordings ADD COLUMN IF NOT EXISTS recording_type TEXT
    DEFAULT 'call' CHECK (recording_type IN ('call', 'voicemail'));

-- Voicemail notifications
CREATE TABLE IF NOT EXISTS voice_voicemails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES voice_calls(id) ON DELETE CASCADE,
    recording_id UUID REFERENCES voice_recordings(id),
    transcript TEXT,
    caller_name TEXT,
    callback_number TEXT,
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    notified_at TIMESTAMPTZ,
    listened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 6: Dashboard Integration ⬜

### Goal
Voice call activity visible in gs-site dashboard.

### Checklist

- [ ] Create `VoiceCallsTile` component (Recent Calls)
- [ ] Create `VoiceStatsTile` component (Call Volume chart)
- [ ] Add tiles to TileRegistry
- [ ] Implement real-time updates via Supabase Realtime
- [ ] Add voicemail indicator badge ← **NEW**

### New Tiles

| Tile | Type | Data |
|------|------|------|
| Recent Calls | Graphic | Last 5 calls with status |
| Call Volume | Graphic | Calls/day chart (7 days) |
| Active Agents | Button | Link to agent management |
| Initiate Call | Button | Trigger outbound call |
| Voicemails | Graphic | Unlistened voicemails count ← **NEW** |

### Files to Create

- [ ] `components/tiles/VoiceCallsTile.tsx`
- [ ] `components/tiles/VoiceStatsTile.tsx`
- [ ] `components/tiles/VoicemailsTile.tsx` ← **NEW**
- [ ] `app/api/voice/stats/route.ts`

---

## Agent Persona → Voice Mapping

| Agent | Role | Voice Provider | Voice Characteristics | Model Tier | Voice ID |
|-------|------|----------------|----------------------|------------|----------|
| Morgan | EA | ElevenLabs | Female, professional, warm | Economy | TBD |
| Emily Liu | EA | ElevenLabs | Female, diplomatic | Economy | TBD |
| Kyle Blonkosky | Coach | ElevenLabs | Male, authoritative | Economy | TBD |
| BashBunni | Coach | Cartesia | Female, casual, friendly | Economy | TBD |
| Charlie Day Von | Coach | ElevenLabs | Male, casual, upbeat | Economy | TBD |
| Victoria Chen | Research | ElevenLabs | Female, analytical | Premium | TBD |
| Olivia Bennett | Research | ElevenLabs | Female, patient | Standard | TBD |
| Daniel Park | SaaS Dev | Cartesia | Male, technical | Standard | TBD |
| Sarah Williams | SaaS Dev | ElevenLabs | Female, technical | Standard | TBD |
| Noah Carter | Marketing | ElevenLabs | Male, energetic | Premium | TBD |
| JARVIZ | Content | Cartesia | Robotic, humorous | Economy | TBD |

---

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Call completion rate | >90% | - | ⬜ |
| Latency p50 | <600ms | - | ⬜ |
| Latency p99 | <1500ms | - | ⬜ |
| Recording capture rate | 100% | - | ⬜ |
| Transfer success rate | >95% | - | ⬜ |
| Voicemail capture rate | 100% | - | ⬜ |
| Cost per call minute | <$0.15 | - | ⬜ |
| Webhook processing success | >99.9% | - | ⬜ |

---

## Risk Mitigations ← **NEW SECTION**

| Risk | Mitigation | Status |
|------|------------|--------|
| Webhook data loss | Dead letter queue + retry logic | ⬜ Phase 1 |
| OpenRouter outage | Circuit breaker + Retell fallback LLM | ⬜ Phase 4 |
| Railway WS server down | Auto-restart + health checks + Retell timeout fallback | ⬜ Phase 4 |
| Retell telephony issues | Monitor community forum; Twilio account as backup | ⬜ Ongoing |
| Recording URL expiration | Immediate sync on call_ended + retry on failure | ⬜ Phase 2 |
| Human transfer failure | Voicemail recording + notification | ⬜ Phase 5 |
| High costs | Model tier optimization + daily spend alerts | ⬜ Phase 3 |
| Vendor lock-in | Provider abstraction layer | ⬜ Phase 1 |

---

## Cost Estimates (Updated)

| Component | Cost | Notes |
|-----------|------|-------|
| Retell (production) | ~$0.10-0.15/min | With model tier optimization |
| Retell (staging) | ~$5/mo | Low volume testing |
| Railway WebSocket | ~$10/mo | Auto-scales |
| Supabase (Pro) | ~$25/mo | Already have |
| Phone numbers | $2-4/mo each | 1 prod + 1 staging |
| Sentry | Free tier | Error tracking |
| OpenRouter | Variable | Pay per token |

**Estimated monthly (low volume):** ~$50-75/mo base + usage

---

## Dependencies & Blockers

| Dependency | Status | Notes |
|------------|--------|-------|
| Supabase migration | ✅ Applied | 8 tables + 5 agents seeded |
| Supabase webhook queue table | ✅ Applied | voice_webhook_queue + voice_voicemails |
| Model tier optimization | ✅ Applied | Agents updated with economy/premium tiers |
| Retell AI account (prod) | ⬜ Not started | Need to sign up |
| Retell AI account (staging) | ⬜ Not started | Separate account for dev |
| Phone number (prod) | ⬜ Not started | Provision via Retell |
| Phone number (staging) | ⬜ Not started | Provision via Retell |
| Railway account | ⬜ Not started | For Phase 4 WS server |
| ElevenLabs voices | ⬜ Not started | Select voices for agents |
| OpenRouter API key | ✅ Have it | Already configured |
| Sentry account | ⬜ Not started | For error tracking |
| ngrok (local dev) | ⬜ Not installed | For webhook testing |

---

## Files Summary

### Created ✅

| File | Purpose |
|------|---------|
| `VOICE_AI_RESEARCH_v2.md` | Platform comparison & recommendations |
| `audio-agents-plan.md` | This implementation plan |
| `supabase/migrations/20251226_create_voice_tables.sql` | Database schema |

### To Create ⬜

| File | Phase | Purpose |
|------|-------|---------|
| `lib/voice/providers/interface.ts` | 1 | Provider abstraction |
| `lib/voice/providers/retell/client.ts` | 1 | Retell implementation |
| `lib/voice/providers/retell/webhooks.ts` | 1 | Webhook parsing |
| `lib/voice/webhook-security.ts` | 1 | Signature verification |
| `lib/voice/webhook-processor.ts` | 1 | Queue processing |
| `lib/voice/types.ts` | 1 | TypeScript types |
| `app/api/voice/webhooks/retell/route.ts` | 1 | Webhook receiver |
| `app/api/voice/calls/route.ts` | 1 | List/create calls |
| `app/api/voice/calls/[callId]/route.ts` | 1 | Single call details |
| `app/api/voice/agents/route.ts` | 1 | List agents |
| `app/api/voice/recordings/sync/route.ts` | 2 | Sync recordings to Supabase |
| `lib/voice/recording-sync.ts` | 2 | Recording download/upload |
| `voice-llm-server/src/index.ts` | 4 | WebSocket server |
| `voice-llm-server/src/circuit-breaker.ts` | 4 | Resilience pattern |
| `voice-llm-server/src/health.ts` | 4 | Health check |
| `lib/voice/voicemail.ts` | 5 | Voicemail handling |
| `app/api/voice/stats/route.ts` | 6 | Dashboard stats |
| `components/tiles/VoiceCallsTile.tsx` | 6 | Recent calls tile |
| `components/tiles/VoiceStatsTile.tsx` | 6 | Call volume chart |
| `components/tiles/VoicemailsTile.tsx` | 6 | Voicemail indicator |

---

## References

- Research: `apps/gs-site/VOICE_AI_RESEARCH_v2.md`
- Agent Team: `apps/gs-site/agent-team/agent-team-12.25.md`
- Hardware: `apps/gs-site/agent-team/my-hardware.md`
- Retell Docs: https://docs.retellai.com/
- Retell Webhooks: https://docs.retellai.com/api-references/webhooks
- OpenRouter Docs: https://openrouter.ai/docs
- Railway Docs: https://docs.railway.app/

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-26 | Initial plan created |
| 2025-12-26 | Added Supabase migration (Phase 0 started) |
| 2025-12-26 | Converted to checklist format |
| 2025-12-26 | Applied migration to Supabase - 8 tables + 5 agents seeded |
| 2025-12-26 | **MAJOR UPDATE:** Added critical infrastructure requirements |
| 2025-12-26 | Added webhook security + retry queue architecture |
| 2025-12-26 | Added provider abstraction layer design |
| 2025-12-26 | Added staging environment requirements to Phase 0 |
| 2025-12-26 | Added circuit breaker pattern to Phase 4 |
| 2025-12-26 | Added voicemail fallback system to Phase 5 |
| 2025-12-26 | Added model tier optimization (cost savings) |
| 2025-12-26 | Revised timeline: 10 days → 16.5 days |
| 2025-12-26 | Added Risk Mitigations section |
| 2025-12-26 | Updated cost estimates with staging environment |
| 2025-12-26 | Created `20251226_voice_reliability_additions.sql` migration |
| 2025-12-26 | Applied reliability migration - webhook queue, voicemails, model tiers |

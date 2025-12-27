# Voice AI Calling Stack Research v2

**Research Date:** December 26, 2025
**Purpose:** Deep evaluation of agentic voice calling stacks with OpenRouter integration
**Target Integration:** gs-site (Next.js 14 + Supabase + Vercel)

---

## Executive Summary

### Winner: **Retell AI** (for our constraints)

| Requirement | Retell Status |
|-------------|---------------|
| Inbound + Outbound PSTN | ✅ Both |
| OpenRouter | ✅ Via Custom LLM WebSocket |
| Audio Recording Ownership | ✅ Dual-channel, download via API |
| Warm Transfer | ✅ Full support (whisper, 3-way, SIP) |
| <800ms Latency | ✅ 500-800ms |
| Vercel Compatible | ✅ Webhooks work; WS server needs Railway |

### Disqualified

| Platform | Reason |
|----------|--------|
| **Bland AI** | No OpenRouter - proprietary models only |
| **Amazon Connect / Azure / Google** | Overkill + no OpenRouter |
| **Vapi** | Expensive ($0.20-0.31/min), no stereo recording confirmed |

### Best OpenRouter Native Option: **Pipecat + Twilio**
- First-class `OpenRouterLLMService`
- Full control, open source
- **BUT**: No built-in warm transfer, Python-only, higher setup complexity

---

## Decision Matrix

| Rank | Option | Telephony | OpenRouter Integration | Audio Recording | Transcription | Warm Transfer | Latency | True Cost/Min | Setup Complexity | Vercel Compatible | Pros | Cons |
|------|--------|-----------|------------------------|-----------------|---------------|---------------|---------|---------------|------------------|-------------------|------|------|
| **1** | **Retell AI** | Both (Twilio/Telnyx), inbound+outbound PSTN, number provisioning included | **Partial** - Custom LLM via WebSocket allows routing to OpenRouter, but requires self-hosted WS server | **Yes** - Multi-channel (agent+caller separate), signed URLs with 24hr expiration, MP3/WAV, download via API | Diarized JSON with word-level timestamps, transcript_with_tool_calls available | **Yes** - Cold + warm, SIP URI support, whisper messages, IVR navigation, 3-way intro | 500-800ms typical | $0.12-0.18/min (voice $0.07 + LLM $0.01-0.06 + telephony $0.015) | Low-Med | **Yes** - webhooks work on Vercel; Custom LLM WS needs Railway/Fly | Best docs, multi-channel recording, warm transfer with whisper, function calling built-in | OpenRouter requires WS server; telephony reliability issues reported Dec 2025; signed URLs expire |
| **2** | **Pipecat + Twilio + OpenRouter** | Both via Twilio WebSockets, full PSTN, BYO Twilio account | **Native** - First-class OpenRouter support with `OpenRouterLLMService`, model switching, function calling | **Manual** - AudioBufferProcessor for capture, must implement storage pipeline | Depends on STT provider (Deepgram/AssemblyAI), diarization available | **No** - Must build custom; Twilio provides SIP REFER | 500-800ms documented | $0.08-0.14/min (Twilio $0.014 + STT $0.0025 + LLM $0.01-0.05 + TTS $0.03-0.07) | **High** | **Partial** - API routes OK, WS server needs Railway/Fly ($5-25/mo) | Full control, native OpenRouter, open source, multi-provider TTS/STT, Pipecat Cloud option | No built-in warm transfer, recording DIY, Python-only, learning curve |
| **3** | **LiveKit Agents + SIP** | Both via LiveKit SIP (Twilio/Telnyx/Plivo compatible), phone numbers $1/mo | **Partial** - OpenAI-compatible base_url allows OpenRouter, but not officially documented | **Yes** - Egress API for room recording, S3/GCS storage supported | Via STT plugins (Deepgram, AssemblyAI), diarization supported | **Partial** - Multi-agent handoff supported, human-in-loop mentioned but not full warm transfer | Sub-500ms claimed | $0.08-0.15/min (agent $0.01 + SIP $0.003-0.01 + STT/TTS $0.03-0.06) | Med-High | **No** - Agents require persistent server (LiveKit Cloud or self-hosted) | TypeScript+Python, production-ready infrastructure, good SIP integration, Kubernetes support | OpenRouter unofficial, warm transfer underdeveloped, requires LiveKit Cloud or self-host |
| **4** | **Vapi** | Both via Twilio (only), inbound+outbound, number provisioning | **Yes** - OpenRouter officially documented as provider, but still uses their billing | **Partial** - 30-day default retention, can configure S3/GCS for ownership, stereo not confirmed | Artifacts API, diarization available, retention configurable | **Yes** - Assistant-based warm transfer, context passed to transfer assistant, Twilio-only | 600-1000ms reported | $0.20-0.31/min (platform markup + LLM + TTS + STT + telephony all billed through Vapi) | Low | **Yes** - webhooks and REST work on Vercel | OpenRouter supported, warm transfer works, good DX, custom LLM server option | Expensive (billing opacity), Twilio-only for transfers, 30-day recording expiry default, no stereo confirmed |
| **5** | **Bland AI** | Both, BYO Twilio supported (BYOT), multi-region | **No** - Uses proprietary fine-tuned models only ("no OpenAI, Anthropic, or foundational providers") | **Yes** - MP3/WAV via API, no documented expiration | Corrected transcripts available, phrase-level with timestamps | **Yes** - Enterprise only, AI-facilitated handoff, DTMF support, hold music | Claims "fastest" but no metrics | $0.11-0.14/min connected + $0.03-0.05/min transfer (Scale plan $499/mo) | Low | **Yes** - REST API webhooks work on Vercel | Good warm transfer, enterprise features, high concurrency, BYO Twilio option | No OpenRouter/custom LLM (dealbreaker), enterprise-gated features, opaque internals |
| **6** | **Vocode OSS** | Via self-hosted telephony server (Twilio integration documented) | **Likely** - Supports OpenAI/Anthropic, OpenAI-compatible endpoints should work | **Undocumented** - Call data retrieval mentioned but no recording details | Via supported STT providers (Deepgram, Whisper, Azure) | **Beta** - Warm transfer listed as beta feature | 600-900ms estimated | $0.08-0.15/min (depends on provider choices) | **High** | **No** - Requires self-hosted Python server | Open source, flexible provider choice, community-maintained | Warm transfer beta, recording unclear, smaller community (3.7k stars), seeking maintainers |
| **7** | **Amazon Connect + Bedrock** | Both, AWS-native telephony, DID provisioning | **No** - Bedrock models only (Claude, Titan, etc.), no external routing | **Yes** - Native recording, S3 storage, unlimited AI features included | Included in base, Contact Lens for analytics | **Yes** - Native agent workspace, full transfer capabilities | Enterprise-grade | $0.038/min + telephony + Bedrock tokens | **High** | **No** - Requires AWS Lambda, not Vercel | Enterprise compliance, unlimited AI, screen recording, native warm transfer | Massive overkill, AWS lock-in, no OpenRouter, complex setup, expensive for low volume |
| **8** | **Azure Communication Services + Azure OpenAI** | Both, Teams integration, global PSTN | **No** - Azure OpenAI only, no external LLM routing | **Undocumented** in marketing materials | Via Azure Cognitive Services | **Undocumented** | Unknown | $0.015-0.04/min + Azure OpenAI tokens | **High** | **Partial** - REST APIs yes, but Azure-centric | Teams integration, enterprise compliance (HIPAA, GDPR, SOC 2) | Azure lock-in, limited docs on AI voice, not purpose-built for agents |
| **9** | **Telnyx + Custom Orchestrator** | Both, excellent SIP/WebRTC, competitive telephony rates | **Yes** - Must build orchestrator that routes to OpenRouter | **Via Telnyx** - Recording API available | Must integrate STT separately | **Must build** - Raw SIP primitives available | Depends on build | $0.005-0.01/min telephony + build costs | **Very High** | **Partial** - Telnyx webhooks yes, orchestrator needs hosting | Cheapest telephony, full control, SIP expertise | Must build everything, no agent framework, significant engineering |
| **10** | **Sindarin.tech** | **Unknown** - Not documented in available materials | **Unknown** - LLM flexibility not documented | **Unknown** | **Unknown** | **Unknown** | Claims "instant" but no metrics | $99/mo for ~10 hours ($0.165/min) + usage | Unknown | Unknown | Low latency claims, proprietary AI, interruption handling | Black box, no telephony docs, no OpenRouter, insufficient information |

---

## Detailed Platform Analysis

### 1. Retell AI (RECOMMENDED)

**OpenRouter Integration:** Requires Custom LLM via WebSocket. You host a WS server that receives Retell's requests and routes them to OpenRouter. This adds latency (1 hop) and infrastructure cost but gives full model control.

**Audio Recording:** Excellent. Multi-channel recordings separate agent and caller audio. Available via `recording_url` and `recording_multi_channel_url` in the Get Call API. PII-scrubbed versions available. 24-hour signed URLs when enabled.

**Warm Transfer:** Full support including:
- Cold and warm transfer modes
- SIP URI destinations
- Whisper messages to recipients before merge
- IVR navigation capability
- 3-way introduction messages
- Human detection with configurable timeout

**Community Issues (Dec 2025):** Telephony connectivity problems reported, SIP issues after Dec 5, some all-numbers-down incidents. Active support community but many "unsolved" threads.

### 2. Vapi

**OpenRouter Integration:** Officially documented as a provider option. Configuration available in assistant settings. However, costs still flow through Vapi billing (markup concerns).

**Audio Recording:** 30-day default retention. Can configure custom S3/GCS for ownership. Dashboard playback or API download via `call.artifact.recording`. Format options: wav;l16 (default) or mp3.

**Warm Transfer:** Assistant-based warm transfer. Creates a "transfer assistant" that briefs the human agent with context from the previous conversation before merging calls. Only works with Twilio phone numbers.

### 3. Bland AI

**OpenRouter Integration:** NOT SUPPORTED. Bland explicitly states: "no OpenAI, Anthropic, or any foundational model providers. Just Bland." They use proprietary fine-tuned models only. **This is a dealbreaker for our requirements.**

**Audio Recording:** Available via GET endpoint, supports MP3 or WAV format headers.

**Warm Transfer:** Enterprise feature. AI initiates second call to brief agent, then merges into 3-way. Includes DTMF support, hold music, merge prompts.

### 4. Pipecat + Twilio + OpenRouter

**OpenRouter Integration:** NATIVE. Pipecat has first-class `OpenRouterLLMService`:
```python
from pipecat.services.openrouter.llm import OpenRouterLLMService

llm = OpenRouterLLMService(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="anthropic/claude-3.5-sonnet"
)
```

**Recording:** Via `AudioBufferProcessor` utility. Must implement storage pipeline to Supabase.

**Warm Transfer:** Not built-in. Would need to use Twilio Conference API or build custom.

### 5. LiveKit Agents

**OpenRouter Integration:** Unofficial via OpenAI-compatible base_url:
```typescript
import * as openai from '@livekit/agents-plugin-openai';

const llm = openai.LLM({
    model: "anthropic/claude-3.5-sonnet",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
});
```

**Warning:** Not officially documented - verify in docs before production

---

## OpenRouter Integration Specifics

### Option 1: Retell AI with OpenRouter

**Control Point:**
```
Where: WebSocket server you host
Data needed: transcript, interaction_type, response_id
Fallback handling: Custom code in your WS server
```

**Integration Architecture:**
```
[Retell] ←WebSocket→ [Your WS Server] ←HTTP→ [OpenRouter API]
```

**Pseudocode:**
```typescript
// Your WebSocket server (runs on Railway/Fly, NOT Vercel)
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', async (ws, req) => {
  const callId = req.url?.split('/').pop();

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    if (message.interaction_type === 'response_required') {
      // Route to OpenRouter with fallback chain
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://your-app.com',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet', // Primary
          route: 'fallback', // OpenRouter's fallback feature
          models: [
            'anthropic/claude-3.5-sonnet',
            'openai/gpt-4o',
            'anthropic/claude-3-haiku'
          ],
          messages: buildMessagesFromTranscript(message.transcript),
        }),
      });

      const completion = await response.json();

      // Stream response back to Retell
      ws.send(JSON.stringify({
        response_type: 'response',
        response_id: message.response_id,
        content: completion.choices[0].message.content,
        content_complete: true,
      }));
    }
  });
});
```

### Option 2: Pipecat + Twilio + OpenRouter (RECOMMENDED for OpenRouter)

**Control Point:**
```
Where: Pipeline configuration / LLMSwitcher utility
Data needed: model ID, messages, tools
Fallback handling: LLMSwitcher supports dynamic switching
```

**Integration Code:**
```python
from pipecat.services.openrouter.llm import OpenRouterLLMService
from pipecat.pipeline.pipeline import Pipeline

# Initialize OpenRouter with fallback via model routing
llm = OpenRouterLLMService(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="anthropic/claude-3.5-sonnet"  # Primary model
)

# Register function for agent actions
llm.register_function("check_crm", check_crm_handler)
llm.register_function("book_appointment", book_appointment_handler)

# For dynamic model switching mid-call:
from pipecat.services.llm_switcher import LLMSwitcher

switcher = LLMSwitcher()
switcher.add_service("analytical", OpenRouterLLMService(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="anthropic/claude-3.5-sonnet"
))
switcher.add_service("fast", OpenRouterLLMService(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="anthropic/claude-3-haiku"
))

# Build pipeline with Twilio transport
pipeline = Pipeline([
    transport.input(),      # Twilio WebSocket audio in
    stt,                    # Deepgram STT
    context_aggregator.user(),
    llm,                    # OpenRouter LLM
    tts,                    # Cartesia/ElevenLabs
    transport.output(),     # Twilio WebSocket audio out
    context_aggregator.assistant(),
])
```

---

## Recording & Persistence Architecture

### Retell AI Recording Pipeline

```
[Call Audio]
    → [Retell Platform Recording]
    → [Webhook: call_ended]
    → [Vercel API Route]
    → [Download from signed URL]
    → [Upload to Supabase Storage]
    → [Store reference in voice_recordings table]
```

**Specifications:**
- Dual-channel: YES (`recording_multi_channel_url`)
- Format: WAV or MP3
- Availability: Post-call only
- URL Expiration: 24 hours with signed URLs enabled
- Copy method: HTTP GET from signed URL, then upload to Supabase

### Pipecat + Twilio Recording Pipeline

```
[Call Audio via Twilio WebSocket]
    → [AudioBufferProcessor in Pipeline]
    → [Buffer accumulated in memory]
    → [On pipeline end: encode to WAV/MP3]
    → [Upload to Supabase Storage]
    → [Store reference in voice_recordings table]

Alternative:
[Twilio Recording API]
    → [Webhook on recording complete]
    → [Download from Twilio URL]
    → [Upload to Supabase Storage]
```

**Specifications:**
- Dual-channel: Via Twilio (separate tracks available)
- Format: WAV (8kHz mono native from Twilio Media Streams)
- Availability: Real-time streaming OR post-call via Twilio
- Storage: Twilio retains 24 months by default

---

## Supabase Schema

```sql
-- Voice Calls: Core call metadata
CREATE TABLE voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- External IDs
    external_call_id TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('retell', 'pipecat', 'livekit', 'vapi', 'bland')),

    -- Call metadata
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status TEXT NOT NULL CHECK (status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'transferred')),
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,

    -- Timing
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Agent assignment
    agent_id UUID REFERENCES voice_agents(id),
    agent_persona TEXT,

    -- Transfer tracking
    transferred_to TEXT,
    transfer_type TEXT CHECK (transfer_type IN ('cold', 'warm', 'agent_handoff')),
    transfer_context JSONB,

    -- Costs
    cost_breakdown JSONB,
    total_cost_usd DECIMAL(10,6),

    -- Custom metadata
    metadata JSONB DEFAULT '{}',

    -- User association
    user_id UUID REFERENCES auth.users(id)
);

-- Voice Turns: Per-utterance with timestamps
CREATE TABLE voice_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,

    turn_index INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
    content TEXT NOT NULL,

    start_ms INTEGER NOT NULL,
    end_ms INTEGER NOT NULL,
    words JSONB,

    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score DECIMAL(3,2),
    confidence DECIMAL(3,2),

    was_interrupted BOOLEAN DEFAULT FALSE,
    interrupted_at_ms INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voice Transcripts: Full transcript JSON
CREATE TABLE voice_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,

    transcript_json JSONB NOT NULL,
    transcript_text TEXT,
    transcript_with_timestamps JSONB,

    speaker_count INTEGER,
    speaker_mapping JSONB,
    detected_language TEXT DEFAULT 'en',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(call_id)
);

-- Voice Recordings: Storage references
CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,

    storage_path TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'voice-recordings',

    original_url TEXT,
    original_url_expires_at TIMESTAMPTZ,

    format TEXT NOT NULL CHECK (format IN ('wav', 'mp3', 'webm', 'ogg')),
    duration_ms INTEGER,
    file_size_bytes BIGINT,
    sample_rate INTEGER,
    channels INTEGER,
    channel_mapping JSONB,

    is_pii_scrubbed BOOLEAN DEFAULT FALSE,
    scrubbed_version_path TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(call_id)
);

-- Voice Tool Events: Function calls during call
CREATE TABLE voice_tool_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
    turn_id UUID REFERENCES voice_turns(id),

    tool_name TEXT NOT NULL,
    tool_input JSONB NOT NULL,
    tool_output JSONB,

    invoked_at_ms INTEGER NOT NULL,
    completed_at_ms INTEGER,

    status TEXT NOT NULL CHECK (status IN ('invoked', 'completed', 'failed')),
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voice Agents: Agent configs
CREATE TABLE voice_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,
    persona TEXT NOT NULL,
    description TEXT,

    voice_provider TEXT NOT NULL CHECK (voice_provider IN ('elevenlabs', 'cartesia', 'openai', 'azure')),
    voice_id TEXT NOT NULL,
    voice_settings JSONB,

    system_prompt TEXT NOT NULL,
    model_primary TEXT NOT NULL DEFAULT 'anthropic/claude-3.5-sonnet',
    model_fallback TEXT[] DEFAULT ARRAY['openai/gpt-4o', 'anthropic/claude-3-haiku'],
    temperature DECIMAL(2,1) DEFAULT 0.7,

    interruption_sensitivity DECIMAL(2,1) DEFAULT 0.5,
    response_delay_ms INTEGER DEFAULT 0,
    max_call_duration_seconds INTEGER DEFAULT 900,

    enabled_tools TEXT[] DEFAULT ARRAY[]::TEXT[],

    can_transfer BOOLEAN DEFAULT TRUE,
    transfer_targets JSONB,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_calls_external_id ON voice_calls(external_call_id);
CREATE INDEX idx_voice_calls_user_id ON voice_calls(user_id);
CREATE INDEX idx_voice_calls_created_at ON voice_calls(created_at DESC);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_turns_call_id ON voice_turns(call_id);
CREATE INDEX idx_voice_turns_call_turn ON voice_turns(call_id, turn_index);
CREATE INDEX idx_voice_transcripts_call_id ON voice_transcripts(call_id);
CREATE INDEX idx_voice_recordings_call_id ON voice_recordings(call_id);
CREATE INDEX idx_voice_tool_events_call_id ON voice_tool_events(call_id);
CREATE INDEX idx_voice_tool_events_tool_name ON voice_tool_events(tool_name);
CREATE INDEX idx_voice_agents_name ON voice_agents(name);
CREATE INDEX idx_voice_agents_active ON voice_agents(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tool_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_agents ENABLE ROW LEVEL SECURITY;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE voice_turns;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_calls;
```

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Serverless)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /api/voice/webhooks/retell  ← call events             │ │
│  │  /api/voice/recordings/sync  ← copy to Supabase        │ │
│  │  /api/voice/calls/initiate   ← outbound triggers       │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│ RAILWAY (~$10/mo)         │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │  Custom LLM WebSocket Server                         │   │
│  │  - Receives Retell requests                          │   │
│  │  - Routes to OpenRouter with fallback chain          │   │
│  │  - claude-3.5-sonnet → gpt-4o → claude-3-haiku      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│ SUPABASE                  ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  voice_calls          - Call metadata                 │  │
│  │  voice_turns          - Per-utterance timestamps      │  │
│  │  voice_transcripts    - Full diarized JSON            │  │
│  │  voice_recordings     - Storage refs (copied files)   │  │
│  │  voice_tool_events    - CRM lookups, bookings         │  │
│  │  voice_agents         - 14 agent personas             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Storage: voice-recordings bucket (dual-channel WAV)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Timeline to Production

| Phase | Days |
|-------|------|
| Phase 1: Retell + Supabase (built-in LLM) | 5.5 |
| Phase 2: Add OpenRouter via Custom LLM | 3 |
| **Total** | **~8-9 days** |

---

## Cost Estimate

| Component | Cost |
|-----------|------|
| Retell (at ~$0.15/min) | ~$9/hr of calls |
| Railway WebSocket | ~$10/mo |
| Supabase (Pro) | ~$25/mo |
| Phone numbers | $2/mo each |

---

## Key Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Retell telephony reliability (Dec 2025 issues) | Monitor community forum; have Twilio account ready as backup |
| 24hr recording URL expiration | Webhook handler copies to Supabase immediately on call_ended |
| Custom LLM WebSocket adds latency | Use Railway edge region closest to Retell; cache system prompts |
| Vendor lock-in on transcripts | Export to standardized JSON format in voice_transcripts table |
| Cost creep at scale | Track cost_breakdown per call; evaluate Pipecat at >$2k/mo voice spend |

---

## Anti-Patterns Flagged

### Bland AI
- **Vendor lock-in trap**: Proprietary models only, cannot use OpenRouter or any external LLM
- **Dealbreaker for requirements**

### Vapi
- **Hidden costs**: Billing opacity - they mark up underlying LLM/TTS/STT costs
- **30-day recording expiration**: Must configure custom S3/GCS or lose recordings

### Managed Platforms Generally
- **Signed URL expiration**: Retell (24hr), Vapi (varies) - must copy recordings immediately
- **No WebSocket on Vercel**: Any custom LLM integration requires separate hosting

---

## Sources

- Retell AI Docs: https://docs.retellai.com/
- Retell Pricing: https://www.retellai.com/pricing
- Retell Community: https://community.retellai.com/
- Vapi Docs: https://docs.vapi.ai/
- Bland AI Docs: https://docs.bland.ai/
- Pipecat GitHub: https://github.com/pipecat-ai/pipecat
- Pipecat Docs: https://docs.pipecat.ai/
- LiveKit Agents: https://docs.livekit.io/agents/
- OpenRouter Docs: https://openrouter.ai/docs
- Twilio Voice Pricing: https://www.twilio.com/en-us/voice/pricing/us

---

**Previous Research:** See `VOICE_AI_RESEARCH.md` for original December 19, 2025 analysis.

# Voice AI Calling Agent Research Summary

**Research Date:** December 19, 2025
**Purpose:** Evaluate platforms for building AI agents that can make and receive phone calls
**Target Integration:** gs-site (Next.js 14 + Supabase + Vercel)

---

## Executive Summary

This document evaluates voice AI platforms for building a team of AI calling agents. Two approaches exist:

| Approach | Platforms | Complexity | Best For |
|----------|-----------|------------|----------|
| **Managed** | Retell AI, Vapi | Low | Fast shipping, less maintenance |
| **DIY** | Twilio + OpenAI, Vonage | Medium | Maximum control, customization |

**Top Recommendation:** Start with **Retell AI** for speed-to-market, migrate to **Twilio + OpenAI Realtime** if customization needs grow.

---

## Quick Comparison Matrix

| Platform | True Cost/Min | Docs Quality | Agent-Codeable | Warm Transfer | HIPAA | Recommendation |
|----------|---------------|--------------|----------------|---------------|-------|----------------|
| **Retell AI** | $0.13-0.15 | ⭐⭐⭐⭐⭐ | ✅ Excellent | ✅ Yes | ✅ Included | **Best for v1** |
| **Twilio + OpenAI** | $0.08-0.18 | ⭐⭐⭐⭐⭐ | ✅ Excellent | ✅ Yes | ✅ Yes | **Best for control** |
| **Vapi** | $0.20-0.31 | ⭐⭐⭐⭐ | ✅ Good | ❌ No | +$1K/mo | Flexible but costly |
| **Vonage** | $0.10-0.15 | ⭐⭐⭐⭐ | ✅ Good | ✅ Yes | ✅ Yes | Solid alternative |

---

## Platform Deep Dives

### 1. Retell AI (Managed Platform)

#### Pricing

**Free Tier:**
- $10 free credits
- 20 concurrent calls
- 10 knowledge bases
- Discord + email support

**Pay-as-You-Go Components:**

| Component | Cost/Min |
|-----------|----------|
| Voice Engine (ElevenLabs/Cartesia) | $0.07 |
| Voice Engine (OpenAI) | $0.08 |
| GPT-4o | $0.05 |
| Claude 3.5 Haiku | $0.02 |
| Gemini 2.0 Flash | $0.006 |
| Telephony (US) | $0.015 |
| Telephony (UK/AU) | $0.10 |
| Knowledge Base add-on | +$0.005 |
| Batch Call add-on | +$0.005/dial |
| Branded Caller ID | +$0.10/call |

**Typical Call Cost (GPT-4o + ElevenLabs):** ~$0.135/min

**Monthly Subscriptions:**
- Phone number: $2/month
- Extra concurrency: $8/month per call
- Verified phone number: $100/month

**Enterprise:** $0.05/min at volume (50+ concurrent calls)

#### Pros
- Transparent, single-invoice billing
- Excellent documentation (Mintlify, 50+ API endpoints)
- TypeScript SDK with full types (`retell-sdk`)
- Compliance included (SOC 2 Type II, HIPAA, GDPR)
- Warm transfers to humans
- 31+ languages
- 99.99% uptime
- Post-call analytics + A/B testing
- CRM integrations

#### Cons
- No visual flow builder (code/config only)
- 500-800ms latency (noticeable pauses)
- No voice cloning
- No sandbox/version history
- UK unavailable
- Slow support response times
- Requires coding (not truly no-code)

#### Integration Pattern for gs-site

```typescript
// lib/voice/retell-client.ts
import Retell from 'retell-sdk';

export const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY!
});

// app/api/voice/calls/route.ts
export async function POST(req: Request) {
  const { phoneNumber, agentId } = await req.json();
  const call = await retell.call.createPhoneCall({
    from_number: process.env.RETELL_PHONE_NUMBER!,
    to_number: phoneNumber,
    agent_id: agentId
  });
  return Response.json(call);
}

// app/api/webhooks/retell/route.ts
export async function POST(req: Request) {
  const { event, call } = await req.json();
  // Store in Supabase
  await supabase.from('voice_calls').insert({
    call_id: call.call_id,
    transcript: call.transcript,
    duration: call.duration
  });
  return new Response(null, { status: 204 });
}
```

---

### 2. Vapi (Managed Platform)

#### Pricing

**Base Fee:** $0.05/min (Vapi orchestration only)

**Additional Provider Costs:**

| Component | Provider | Cost/Min |
|-----------|----------|----------|
| Telephony | Twilio | $0.008-0.014 |
| Telephony | Telnyx | $0.006 |
| STT | Deepgram | $0.01 |
| STT | Assembly AI | $0.00025 |
| TTS | ElevenLabs | $0.036 |
| TTS | PlayHT | $0.065 |
| TTS | Deepgram | $0.011 |
| LLM | GPT-4o | $0.02-0.05 |
| LLM | Claude 3 Opus | $0.09 |

**True Cost:** $0.13-0.31/min depending on providers

**Plan Tiers:**

| Plan | Monthly | Included Minutes |
|------|---------|------------------|
| Pay-as-you-go | $0 | None (10 concurrent max) |
| Agency | $500 | 3,000 |
| Startup | $1,000 | 7,500 |
| Enterprise | $40K-70K/year | Custom |

**Hidden Costs:**
- HIPAA compliance: +$1,000/month
- Extra SIP lines: +$10/month each
- Surge pricing: +$0.05/min during spikes

#### Pros
- Maximum provider flexibility (swap STT/TTS/LLM)
- 100+ languages
- 1000+ templates for fast prototyping
- Excellent TypeScript SDKs (`@vapi-ai/server-sdk`, `@vapi-ai/web`)
- Vercel compatible (client-side WebSocket)
- SOC2/HIPAA/PCI (with add-on)

#### Cons
- Complex billing (4-6 separate invoices)
- Misleading advertised pricing ($0.05 vs $0.20+ real)
- No warm transfers
- Reported 6-7 second latency issues
- Voice-only (no chat/SMS)
- Poor support (email/Discord only, slow)
- HIPAA costs $1K/month extra

#### Integration Pattern for gs-site

```typescript
// Client component
'use client';
import Vapi from '@vapi-ai/web';

export function VoiceCall({ assistantId }: { assistantId: string }) {
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);
    vapiRef.current.on('call-end', () => console.log('Call ended'));
    return () => vapiRef.current?.stop();
  }, []);

  return <button onClick={() => vapiRef.current?.start(assistantId)}>Call</button>;
}

// Server SDK for outbound
import { VapiClient } from '@vapi-ai/server-sdk';
const vapi = new VapiClient({ token: process.env.VAPI_API_KEY });
```

---

### 3. Twilio + OpenAI Realtime (DIY Approach)

#### Pricing

| Component | Cost |
|-----------|------|
| Phone number | $1.15/month |
| Inbound calls | $0.0085/min |
| Outbound calls | $0.014/min |
| OpenAI Realtime (audio) | ~$0.06/min |
| OpenAI Realtime (text) | ~$0.10/min |
| **Total estimate** | **$0.08-0.18/min** |

#### What You Build

- ~200-250 lines of code
- WebSocket proxy between Twilio and OpenAI
- Audio format conversion (μ-law ↔ PCM16)
- Session management
- Custom agent logic

#### Tech Stack Required

```json
{
  "dependencies": {
    "fastify": "^4.x",
    "@fastify/websocket": "^8.x",
    "ws": "^8.x",
    "dotenv": "^16.x"
  }
}
```

#### Pros
- Maximum control over entire stack
- No vendor lock-in (swap any component)
- Excellent documentation (official tutorials)
- Massive ecosystem (300K+ customers, 10M+ developers)
- Native warm transfers
- Perfect webhook model for Next.js API routes
- Future-proof (swap OpenAI for Claude anytime)

#### Cons
- You build and maintain everything
- More code surface area for bugs
- No pre-built agent logic
- No visual builder
- Debugging is your responsibility
- OpenAI Realtime API dependency

#### Official Tutorial Reference

**Node.js:** https://www.twilio.com/en-us/blog/voice-ai-assistant-openai-realtime-api-node
**Python:** https://www.twilio.com/en-us/blog/voice-ai-assistant-openai-realtime-api-python
**Code Exchange:** https://www.twilio.com/code-exchange/ai-voice-assistant-openai-realtime-api

#### Architecture for gs-site

```
┌─────────────────────────────────────────────────────────┐
│                     gs-site (Next.js)                   │
│  ┌─────────────────┐    ┌────────────────────────────┐ │
│  │ API Routes      │    │ Separate WebSocket Server  │ │
│  │ /api/calls/*    │    │ (Fastify + ws)             │ │
│  │ - create call   │    │ - Twilio Media Streams     │ │
│  │ - webhooks      │    │ - OpenAI Realtime proxy    │ │
│  └────────┬────────┘    └─────────────┬──────────────┘ │
└───────────┼───────────────────────────┼─────────────────┘
            │                           │
            ▼                           ▼
     ┌──────────────┐           ┌───────────────┐
     │   Supabase   │           │    Twilio     │
     │  - calls     │           │  - telephony  │
     │  - transcripts│          │  - numbers    │
     └──────────────┘           └───────────────┘
```

**Note:** WebSocket server must run separately from Vercel (Railway, Render, or self-hosted) since Vercel serverless doesn't support persistent WebSocket connections.

---

### 4. Vonage (DIY Approach)

#### Pricing

| Component | Cost |
|-----------|------|
| Phone number | ~$1/month |
| Voice calls | $0.00814/min |
| + STT/TTS/LLM providers | Variable |
| **Total estimate** | **$0.10-0.15/min** |

#### Pros
- Strong telephony + WebSocket streaming
- AI Studio reduces some coding
- Solid speech options
- Good documentation

#### Cons
- Smaller community than Twilio
- AI Studio can be limiting
- Enterprise packaging complexity
- Less voice AI-specific content

---

## Backend Architecture Overview

### For Managed Platforms (Retell/Vapi)

```
┌─────────────────────────────────────────────────────────────┐
│                    gs-site (Next.js on Vercel)              │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │  Client Components│  │  API Routes                     │ │
│  │  - Voice SDK init │  │  - /api/voice/calls             │ │
│  │  - Call controls  │  │  - /api/webhooks/retell         │ │
│  │  - Live transcript│  │  - /api/webhooks/vapi           │ │
│  └────────┬─────────┘  └────────────────┬────────────────┘ │
└───────────┼─────────────────────────────┼──────────────────┘
            │ WebSocket (client-side)     │ HTTP Webhooks
            ▼                             ▼
┌───────────────────────┐    ┌───────────────────────────────┐
│  Voice AI Platform    │    │  Supabase                     │
│  - Retell / Vapi      │    │  - voice_calls table          │
│  - Handles telephony  │    │  - transcripts                │
│  - STT/TTS/LLM        │    │  - agent_logs                 │
└───────────────────────┘    │  - Realtime subscriptions     │
                             └───────────────────────────────┘
```

### For DIY (Twilio + OpenAI)

```
┌─────────────────────────────────────────────────────────────┐
│                    gs-site (Next.js on Vercel)              │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │  UI Components   │  │  API Routes                     │ │
│  │  - Call status   │  │  - /api/voice/initiate          │ │
│  │  - Agent selector│  │  - /api/voice/webhook           │ │
│  └──────────────────┘  └────────────────┬────────────────┘ │
└────────────────────────────────────────┼───────────────────┘
                                          │
┌─────────────────────────────────────────┼───────────────────┐
│           WebSocket Server (Railway/Render)                 │
│  ┌──────────────────────────────────────▼────────────────┐ │
│  │  Fastify + ws                                          │ │
│  │  - Twilio Media Streams handler                        │ │
│  │  - OpenAI Realtime API connection                      │ │
│  │  - Audio format conversion                             │ │
│  │  - Agent logic / prompts                               │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
            │                             │
            ▼                             ▼
┌───────────────────────┐    ┌───────────────────────────────┐
│       Twilio          │    │  Supabase                     │
│  - Phone numbers      │    │  - voice_calls                │
│  - PSTN connectivity  │    │  - transcripts                │
│  - Media Streams      │    │  - agent_sessions             │
└───────────────────────┘    └───────────────────────────────┘
            │
            ▼
┌───────────────────────┐
│   OpenAI Realtime     │
│  - GPT-4o audio       │
│  - Speech-to-speech   │
└───────────────────────┘
```

---

## Supabase Schema for Voice Calls

```sql
-- Voice calls table
CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL, -- 'retell', 'vapi', 'twilio'
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  from_number TEXT,
  to_number TEXT,
  agent_id TEXT,
  status TEXT DEFAULT 'initiated',
  duration_seconds INTEGER,
  cost_cents INTEGER,
  transcript JSONB,
  summary TEXT,
  sentiment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB
);

-- Call events for real-time updates
CREATE TABLE voice_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT REFERENCES voice_calls(call_id),
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent configurations
CREATE TABLE voice_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_agent_id TEXT,
  system_prompt TEXT,
  voice_id TEXT,
  language TEXT DEFAULT 'en',
  config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_agents ENABLE ROW LEVEL SECURITY;

-- Enable realtime for call events
ALTER PUBLICATION supabase_realtime ADD TABLE voice_call_events;
```

---

## Environment Variables

```env
# Retell AI
RETELL_API_KEY=your_retell_api_key
RETELL_PHONE_NUMBER=+1234567890

# Vapi (if using)
VAPI_API_KEY=your_vapi_server_key
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_public_token

# Twilio (if using DIY approach)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI (for Twilio DIY)
OPENAI_API_KEY=your_openai_key

# Webhook secrets
VOICE_WEBHOOK_SECRET=your_webhook_secret
```

---

## Recommendation Summary

### For gs-site v1: Use Retell AI

**Reasons:**
1. **Fastest time to market** - hours, not days
2. **Best documentation** - agents can code reliably
3. **Lower true cost** - $0.13/min vs $0.25/min (Vapi)
4. **Warm transfers** - hand off to humans (critical for real estate)
5. **Compliance included** - no surprise fees
6. **Single invoice** - simpler accounting

### For gs-site v2 (if needed): Migrate to Twilio + OpenAI

**When to migrate:**
- Need custom agent logic beyond config
- Want to swap LLM providers freely
- Retell's latency (500-800ms) becomes a problem
- Need features Retell doesn't support

### Hybrid Strategy

```
Week 1-2: Ship with Retell AI
  └─ Get real user feedback
  └─ Understand actual requirements

Month 2+: Evaluate if Twilio DIY needed
  └─ Only if hitting Retell limitations
  └─ Preserve all Supabase data/schema
```

---

## Next Steps

1. [ ] Create Retell AI account and get API keys
2. [ ] Set up phone number in Retell dashboard
3. [ ] Create first agent with system prompt
4. [ ] Implement `/api/voice/*` routes in gs-site
5. [ ] Add Supabase tables for call logging
6. [ ] Build basic call UI component
7. [ ] Test inbound + outbound calls
8. [ ] Add webhook handlers for call events

---

## References

### Documentation
- [Retell AI Docs](https://docs.retellai.com)
- [Retell AI Pricing](https://www.retellai.com/pricing)
- [Vapi Docs](https://docs.vapi.ai)
- [Twilio Voice Docs](https://www.twilio.com/docs/voice)
- [Twilio + OpenAI Tutorial](https://www.twilio.com/en-us/blog/voice-ai-assistant-openai-realtime-api-node)

### Comparison Articles
- [Retell vs Vapi](https://www.retellai.com/blog/retell-vs-vapi)
- [Voice Agent Platforms Compared](https://softcery.com/lab/choosing-the-right-voice-agent-platform-in-2025)
- [Vapi Pricing Breakdown](https://blog.dograh.com/vapi-pricing-breakdown-2025-plans-hidden-costs-what-to-expect/)
- [Retell AI Review](https://blog.dograh.com/retell-ai-review-2025-pros-cons-pricing-and-features/)

### Code Examples
- [Twilio OpenAI Code Exchange](https://www.twilio.com/code-exchange/ai-voice-assistant-openai-realtime-api)
- [Retell SDK npm](https://www.npmjs.com/package/retell-sdk)
- [Vapi Server SDK](https://www.npmjs.com/package/@vapi-ai/server-sdk)
- [Vapi Web SDK](https://www.npmjs.com/package/@vapi-ai/web)

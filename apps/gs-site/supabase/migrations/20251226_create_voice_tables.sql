-- ============================================================================
-- Voice AI Tables Migration
-- Created: December 26, 2025
-- Purpose: Schema for agentic voice calling system (Retell AI integration)
-- Reference: apps/gs-site/VOICE_AI_RESEARCH_v2.md
-- ============================================================================

-- ============================================================================
-- 1. VOICE AGENTS TABLE
-- Stores AI agent configurations synced from agent-team definitions
-- Must be created first as other tables reference it
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT NOT NULL UNIQUE,
    persona TEXT NOT NULL,  -- 'Direct', 'Diplomatic', 'Analytical', 'Creative', 'Casual', 'Technical'
    description TEXT,

    -- External platform IDs
    retell_agent_id TEXT,  -- Retell's agent ID

    -- Voice configuration
    voice_provider TEXT NOT NULL CHECK (voice_provider IN ('elevenlabs', 'cartesia', 'openai', 'azure', 'retell')),
    voice_id TEXT NOT NULL,  -- Provider-specific voice ID
    voice_settings JSONB DEFAULT '{}',  -- {"stability": 0.5, "similarity_boost": 0.75, ...}

    -- LLM configuration
    system_prompt TEXT NOT NULL,
    model_primary TEXT NOT NULL DEFAULT 'anthropic/claude-3.5-sonnet',
    model_fallback TEXT[] DEFAULT ARRAY['openai/gpt-4o', 'anthropic/claude-3-haiku'],
    temperature DECIMAL(2,1) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),

    -- Behavior settings
    interruption_sensitivity DECIMAL(2,1) DEFAULT 0.5 CHECK (interruption_sensitivity >= 0 AND interruption_sensitivity <= 1),
    response_delay_ms INTEGER DEFAULT 0 CHECK (response_delay_ms >= 0),
    max_call_duration_seconds INTEGER DEFAULT 900 CHECK (max_call_duration_seconds > 0),  -- 15 min default

    -- Tools this agent can use
    enabled_tools TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Transfer configuration
    can_transfer BOOLEAN DEFAULT TRUE,
    transfer_targets JSONB DEFAULT '[]',  -- [{"name": "Sales", "number": "+1...", "type": "human"}, ...]

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_agents_name ON voice_agents(name);
CREATE INDEX idx_voice_agents_retell_id ON voice_agents(retell_agent_id) WHERE retell_agent_id IS NOT NULL;
CREATE INDEX idx_voice_agents_active ON voice_agents(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE voice_agents IS 'AI agent configurations for voice calling, synced from agent-team definitions';
COMMENT ON COLUMN voice_agents.persona IS 'Communication style: Direct, Diplomatic, Analytical, Creative, Casual, Technical';
COMMENT ON COLUMN voice_agents.model_primary IS 'OpenRouter model identifier for primary LLM';
COMMENT ON COLUMN voice_agents.model_fallback IS 'Fallback models if primary is unavailable';

-- ============================================================================
-- 2. VOICE CALLS TABLE
-- Core call metadata for every inbound/outbound call
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- External identifiers
    external_call_id TEXT NOT NULL UNIQUE,  -- Platform's call ID (Retell/Vapi/etc)
    platform TEXT NOT NULL CHECK (platform IN ('retell', 'pipecat', 'livekit', 'vapi', 'twilio')),

    -- Call metadata
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
        'initiated',      -- Call created but not connected
        'ringing',        -- Ringing on recipient end
        'in_progress',    -- Active call
        'completed',      -- Normal end
        'failed',         -- Technical failure
        'no_answer',      -- Recipient didn't answer
        'busy',           -- Recipient busy
        'voicemail',      -- Went to voicemail
        'transferred'     -- Handed off to human/other agent
    )),
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,

    -- Timing
    started_at TIMESTAMPTZ,        -- When call connected
    answered_at TIMESTAMPTZ,       -- When recipient answered
    ended_at TIMESTAMPTZ,          -- When call ended
    duration_ms INTEGER,           -- Total duration in milliseconds
    talk_time_ms INTEGER,          -- Actual talk time (excludes ringing)

    -- Agent assignment
    agent_id UUID REFERENCES voice_agents(id),
    agent_persona TEXT,            -- Snapshot of persona at call time

    -- Transfer tracking
    transferred_to TEXT,           -- Phone number or agent ID
    transfer_type TEXT CHECK (transfer_type IN ('cold', 'warm', 'agent_handoff')),
    transfer_context JSONB,        -- Summary passed to recipient
    transfer_at TIMESTAMPTZ,       -- When transfer occurred

    -- Call outcome
    outcome TEXT,                  -- 'message_taken', 'appointment_booked', 'info_provided', etc.
    outcome_details JSONB,         -- Structured outcome data

    -- Costs (tracked per call for analytics)
    cost_breakdown JSONB DEFAULT '{}',  -- {"platform": 0.05, "llm": 0.02, "tts": 0.01, "stt": 0.005}
    total_cost_usd DECIMAL(10,6),

    -- Custom metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- User association (if applicable)
    user_id UUID,  -- Can reference auth.users if needed

    -- Error tracking
    error_code TEXT,
    error_message TEXT
);

CREATE INDEX idx_voice_calls_external_id ON voice_calls(external_call_id);
CREATE INDEX idx_voice_calls_created_at ON voice_calls(created_at DESC);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_calls_direction ON voice_calls(direction);
CREATE INDEX idx_voice_calls_agent_id ON voice_calls(agent_id);
CREATE INDEX idx_voice_calls_from_number ON voice_calls(from_number);
CREATE INDEX idx_voice_calls_to_number ON voice_calls(to_number);
CREATE INDEX idx_voice_calls_user_id ON voice_calls(user_id) WHERE user_id IS NOT NULL;

COMMENT ON TABLE voice_calls IS 'Core metadata for all voice calls (inbound and outbound)';
COMMENT ON COLUMN voice_calls.external_call_id IS 'Unique call ID from the voice platform (Retell, etc)';
COMMENT ON COLUMN voice_calls.cost_breakdown IS 'Itemized costs: platform fee, LLM tokens, TTS, STT, telephony';

-- ============================================================================
-- 3. VOICE TURNS TABLE
-- Per-utterance data with timestamps for conversation analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,

    -- Turn metadata
    turn_index INTEGER NOT NULL,  -- Sequential order in conversation
    role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),

    -- Content
    content TEXT NOT NULL,

    -- Timing (milliseconds from call start)
    start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
    end_ms INTEGER NOT NULL CHECK (end_ms >= start_ms),

    -- Word-level timestamps for precise sync
    words JSONB,  -- [{"word": "hello", "start_ms": 0, "end_ms": 200, "confidence": 0.98}, ...]

    -- Analysis
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

    -- Intent detection (for routing)
    detected_intent TEXT,
    intent_confidence DECIMAL(3,2),

    -- Interruption tracking
    was_interrupted BOOLEAN DEFAULT FALSE,
    interrupted_at_ms INTEGER,

    -- Metadata
    language TEXT DEFAULT 'en',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_turns_call_id ON voice_turns(call_id);
CREATE INDEX idx_voice_turns_call_turn ON voice_turns(call_id, turn_index);
CREATE INDEX idx_voice_turns_role ON voice_turns(role);
CREATE INDEX idx_voice_turns_intent ON voice_turns(detected_intent) WHERE detected_intent IS NOT NULL;

COMMENT ON TABLE voice_turns IS 'Individual utterances in a call with timestamps and analysis';
COMMENT ON COLUMN voice_turns.words IS 'Word-level timestamps for transcript sync with audio';
COMMENT ON COLUMN voice_turns.detected_intent IS 'Extracted intent for routing (property_inquiry, scheduling, etc)';

-- ============================================================================
-- 4. VOICE TRANSCRIPTS TABLE
-- Full transcript storage in various formats
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,

    -- Raw platform transcript
    transcript_json JSONB NOT NULL,  -- Platform's native format (preserve for debugging)

    -- Processed versions
    transcript_text TEXT,            -- Plain text concatenation
    transcript_with_timestamps JSONB,  -- Normalized format with timing
    transcript_with_speakers JSONB,   -- Format: [{"speaker": "agent", "text": "...", "start": 0, "end": 1500}, ...]

    -- Diarization info
    speaker_count INTEGER,
    speaker_mapping JSONB,           -- {"speaker_0": "agent", "speaker_1": "caller"}

    -- Language detection
    detected_language TEXT DEFAULT 'en',
    language_confidence DECIMAL(3,2),

    -- Quality metrics
    word_count INTEGER,
    avg_confidence DECIMAL(3,2),

    -- Summary (LLM-generated)
    summary TEXT,
    key_points TEXT[],
    action_items TEXT[],

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(call_id)
);

CREATE INDEX idx_voice_transcripts_call_id ON voice_transcripts(call_id);

COMMENT ON TABLE voice_transcripts IS 'Full transcripts with multiple format options';
COMMENT ON COLUMN voice_transcripts.transcript_json IS 'Raw platform response - preserve for debugging';
COMMENT ON COLUMN voice_transcripts.summary IS 'LLM-generated call summary';

-- ============================================================================
-- 5. VOICE RECORDINGS TABLE
-- Storage references for call audio files
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,

    -- Supabase Storage location
    storage_path TEXT NOT NULL,      -- e.g., 'calls/abc123/recording.wav'
    storage_bucket TEXT NOT NULL DEFAULT 'voice-recordings',

    -- Original source (platform URL - may expire)
    original_url TEXT,
    original_url_expires_at TIMESTAMPTZ,
    original_multi_channel_url TEXT,  -- Separate agent/caller tracks

    -- Recording metadata
    format TEXT NOT NULL CHECK (format IN ('wav', 'mp3', 'webm', 'ogg', 'flac')),
    duration_ms INTEGER,
    file_size_bytes BIGINT,
    sample_rate INTEGER,             -- e.g., 8000, 16000, 44100
    bit_depth INTEGER,               -- e.g., 16, 24
    channels INTEGER,                -- 1 = mono, 2 = stereo (dual-channel)

    -- Channel mapping for dual-channel recordings
    channel_mapping JSONB,           -- {"channel_0": "agent", "channel_1": "caller"}

    -- Privacy/compliance
    is_pii_scrubbed BOOLEAN DEFAULT FALSE,
    scrubbed_version_path TEXT,      -- Path to PII-scrubbed version
    retention_until TIMESTAMPTZ,     -- When to auto-delete (compliance)

    -- Processing status
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'downloading', 'uploaded', 'failed')),
    sync_error TEXT,
    synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(call_id)
);

CREATE INDEX idx_voice_recordings_call_id ON voice_recordings(call_id);
CREATE INDEX idx_voice_recordings_sync_status ON voice_recordings(sync_status) WHERE sync_status != 'uploaded';

COMMENT ON TABLE voice_recordings IS 'Audio file references - files stored in Supabase Storage';
COMMENT ON COLUMN voice_recordings.original_url IS 'Platform URL (expires in 24hr for Retell) - copy immediately';
COMMENT ON COLUMN voice_recordings.channel_mapping IS 'For dual-channel: which channel is agent vs caller';

-- ============================================================================
-- 6. VOICE TOOL EVENTS TABLE
-- Function calls made by AI during calls
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_tool_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
    turn_id UUID REFERENCES voice_turns(id),

    -- Tool information
    tool_name TEXT NOT NULL,         -- 'check_crm', 'book_appointment', 'lookup_property', etc.
    tool_input JSONB NOT NULL,       -- Arguments passed to tool
    tool_output JSONB,               -- Result returned

    -- Timing (ms from call start)
    invoked_at_ms INTEGER NOT NULL,
    completed_at_ms INTEGER,
    duration_ms INTEGER GENERATED ALWAYS AS (completed_at_ms - invoked_at_ms) STORED,

    -- Status
    status TEXT NOT NULL DEFAULT 'invoked' CHECK (status IN ('invoked', 'running', 'completed', 'failed', 'timeout')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_tool_events_call_id ON voice_tool_events(call_id);
CREATE INDEX idx_voice_tool_events_tool_name ON voice_tool_events(tool_name);
CREATE INDEX idx_voice_tool_events_status ON voice_tool_events(status) WHERE status != 'completed';

COMMENT ON TABLE voice_tool_events IS 'Function/tool calls made by AI agent during calls';
COMMENT ON COLUMN voice_tool_events.tool_name IS 'Function name: check_crm, book_appointment, transfer_call, etc.';

-- ============================================================================
-- 7. VOICE PHONE NUMBERS TABLE
-- Track provisioned phone numbers and their assignments
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Number info
    phone_number TEXT NOT NULL UNIQUE,  -- E.164 format: +14805551234
    display_name TEXT,                   -- Friendly name: "Main Reception"

    -- Provider info
    provider TEXT NOT NULL CHECK (provider IN ('retell', 'twilio', 'telnyx', 'vonage')),
    provider_sid TEXT,                   -- Provider's identifier

    -- Capabilities
    capabilities TEXT[] DEFAULT ARRAY['voice']::TEXT[],  -- 'voice', 'sms', 'mms'

    -- Assignment
    assigned_agent_id UUID REFERENCES voice_agents(id),
    fallback_agent_id UUID REFERENCES voice_agents(id),

    -- Routing rules
    routing_rules JSONB DEFAULT '{}',  -- Time-based routing, overflow, etc.

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Billing
    monthly_cost_usd DECIMAL(10,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_phone_numbers_number ON voice_phone_numbers(phone_number);
CREATE INDEX idx_voice_phone_numbers_agent ON voice_phone_numbers(assigned_agent_id);

COMMENT ON TABLE voice_phone_numbers IS 'Provisioned phone numbers and their agent assignments';

-- ============================================================================
-- 8. VOICE CALL ANALYTICS TABLE (MATERIALIZED VIEW ALTERNATIVE)
-- Daily aggregated metrics for dashboard
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_call_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Time bucket
    date DATE NOT NULL,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),  -- NULL for daily aggregates

    -- Dimensions
    agent_id UUID REFERENCES voice_agents(id),
    direction TEXT CHECK (direction IN ('inbound', 'outbound', 'all')),

    -- Metrics
    total_calls INTEGER DEFAULT 0,
    completed_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    transferred_calls INTEGER DEFAULT 0,

    total_duration_ms BIGINT DEFAULT 0,
    avg_duration_ms INTEGER,

    total_cost_usd DECIMAL(12,4) DEFAULT 0,
    avg_cost_per_call DECIMAL(10,4),

    -- Sentiment distribution
    positive_calls INTEGER DEFAULT 0,
    negative_calls INTEGER DEFAULT 0,
    neutral_calls INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(date, hour, agent_id, direction)
);

CREATE INDEX idx_voice_analytics_date ON voice_call_analytics(date DESC);
CREATE INDEX idx_voice_analytics_agent ON voice_call_analytics(agent_id, date DESC);

COMMENT ON TABLE voice_call_analytics IS 'Pre-aggregated call metrics for fast dashboard queries';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE voice_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tool_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_analytics ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for API routes)
CREATE POLICY "Service role full access on voice_agents" ON voice_agents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on voice_calls" ON voice_calls
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on voice_turns" ON voice_turns
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on voice_transcripts" ON voice_transcripts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on voice_recordings" ON voice_recordings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on voice_tool_events" ON voice_tool_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on voice_phone_numbers" ON voice_phone_numbers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on voice_call_analytics" ON voice_call_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read agents (for UI display)
CREATE POLICY "Authenticated users can read voice_agents" ON voice_agents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can read analytics
CREATE POLICY "Authenticated users can read voice_call_analytics" ON voice_call_analytics
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable for live dashboard updates
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE voice_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_turns;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_voice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voice_agents_updated_at
    BEFORE UPDATE ON voice_agents
    FOR EACH ROW EXECUTE FUNCTION update_voice_updated_at();

CREATE TRIGGER update_voice_calls_updated_at
    BEFORE UPDATE ON voice_calls
    FOR EACH ROW EXECUTE FUNCTION update_voice_updated_at();

CREATE TRIGGER update_voice_transcripts_updated_at
    BEFORE UPDATE ON voice_transcripts
    FOR EACH ROW EXECUTE FUNCTION update_voice_updated_at();

CREATE TRIGGER update_voice_phone_numbers_updated_at
    BEFORE UPDATE ON voice_phone_numbers
    FOR EACH ROW EXECUTE FUNCTION update_voice_updated_at();

CREATE TRIGGER update_voice_analytics_updated_at
    BEFORE UPDATE ON voice_call_analytics
    FOR EACH ROW EXECUTE FUNCTION update_voice_updated_at();

-- ============================================================================
-- SEED DATA: Initial Agent Configurations
-- Based on agent-team/agent-team-12.25.md
-- ============================================================================

INSERT INTO voice_agents (name, persona, description, voice_provider, voice_id, system_prompt, model_primary, enabled_tools, transfer_targets)
VALUES
(
    'Morgan',
    'Direct',
    'Executive Assistant - Calendar management, email prioritization, meeting preparation',
    'elevenlabs',
    'TBD_MORGAN_VOICE_ID',
    E'You are Morgan, an executive assistant for Garrett Sullivan''s real estate business.

Your communication style is Direct - you are analytical, precise, and patient.

Your responsibilities:
- Answer incoming calls professionally
- Determine caller intent (property inquiry, scheduling, general question)
- Take messages with callback number
- Provide basic information about services
- Manage calendar and scheduling requests

Always announce at the start: "This call may be recorded for quality purposes."

If you cannot help, offer to take a message or schedule a callback.
If the caller needs to speak with Garrett directly, you can transfer them.',
    'anthropic/claude-3.5-sonnet',
    ARRAY['check_calendar', 'book_appointment', 'take_message', 'transfer_call'],
    '[{"name": "Garrett", "number": "+1XXXXXXXXXX", "type": "owner"}]'::jsonb
),
(
    'Emily Liu',
    'Diplomatic',
    'Executive Assistant - Strategic planning support, board communication, special projects',
    'elevenlabs',
    'TBD_EMILY_VOICE_ID',
    E'You are Emily Liu, an executive assistant specializing in strategic support.

Your communication style is Diplomatic - you are precise, empathetic, and adaptable.

Your responsibilities:
- Handle sensitive business communications
- Support strategic planning discussions
- Manage special project inquiries
- Navigate complex business situations tactfully

Always announce at the start: "This call may be recorded for quality purposes."

You excel at reading between the lines and understanding the deeper needs of callers.',
    'anthropic/claude-3.5-sonnet',
    ARRAY['check_calendar', 'take_message', 'transfer_call'],
    '[{"name": "Garrett", "number": "+1XXXXXXXXXX", "type": "owner"}]'::jsonb
),
(
    'Noah Carter',
    'Creative',
    'Marketing - Growth strategy, sales opportunities, lead follow-up',
    'elevenlabs',
    'TBD_NOAH_VOICE_ID',
    E'You are Noah Carter, handling marketing and sales inquiries for the real estate business.

Your communication style is Creative - you are analytical, adaptable, and persuasive.

Your responsibilities:
- Handle property inquiries with enthusiasm
- Qualify leads and understand buyer/seller needs
- Provide information about listings and services
- Schedule property showings
- Follow up on marketing campaigns

Always announce at the start: "This call may be recorded for quality purposes."

You are energetic and focused on helping callers find their perfect property or sell successfully.',
    'anthropic/claude-3.5-sonnet',
    ARRAY['lookup_property', 'check_calendar', 'book_showing', 'take_message', 'transfer_call'],
    '[{"name": "Garrett", "number": "+1XXXXXXXXXX", "type": "owner"}, {"name": "Morgan", "agent_id": "TBD", "type": "agent"}]'::jsonb
),
(
    'Kyle Blonkosky',
    'Direct',
    'Coach - Accountability, habits review, progress tracking',
    'elevenlabs',
    'TBD_KYLE_VOICE_ID',
    E'You are Kyle Blonkosky, an accountability coach.

Your communication style is Direct - you are authoritative and patient.

Your responsibilities:
- Check in on goal progress
- Review habits and accountability metrics
- Provide direct, honest feedback
- Motivate without being pushy

Always announce at the start: "This call may be recorded for quality purposes."

You hold people accountable while remaining supportive. You don''t sugarcoat, but you''re not harsh either.',
    'anthropic/claude-3.5-sonnet',
    ARRAY['check_habits', 'check_goals', 'take_message'],
    '[]'::jsonb
),
(
    'Victoria Chen',
    'Analytical',
    'Research - Market analysis, competitive intelligence, data-driven insights',
    'elevenlabs',
    'TBD_VICTORIA_VOICE_ID',
    E'You are Victoria Chen, a research specialist.

Your communication style is Analytical - you are precise, patient, and data-focused.

Your responsibilities:
- Answer research-related questions
- Provide market analysis insights
- Discuss data and statistics clearly
- Support due diligence inquiries

Always announce at the start: "This call may be recorded for quality purposes."

You speak in clear, factual terms and always cite your reasoning. You''re bilingual in English and Spanish.',
    'anthropic/claude-3.5-sonnet',
    ARRAY['search_data', 'take_message', 'transfer_call'],
    '[{"name": "Morgan", "agent_id": "TBD", "type": "agent"}]'::jsonb
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get call statistics for a date range
CREATE OR REPLACE FUNCTION get_voice_call_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_calls BIGINT,
    completed_calls BIGINT,
    avg_duration_seconds NUMERIC,
    total_cost NUMERIC,
    inbound_calls BIGINT,
    outbound_calls BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_calls,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_calls,
        ROUND(AVG(duration_ms) / 1000.0, 1) as avg_duration_seconds,
        ROUND(SUM(COALESCE(total_cost_usd, 0))::NUMERIC, 2) as total_cost,
        COUNT(*) FILTER (WHERE direction = 'inbound')::BIGINT as inbound_calls,
        COUNT(*) FILTER (WHERE direction = 'outbound')::BIGINT as outbound_calls
    FROM voice_calls
    WHERE created_at >= start_date
      AND created_at < end_date + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get recent calls for dashboard tile
CREATE OR REPLACE FUNCTION get_recent_voice_calls(
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    direction TEXT,
    status TEXT,
    from_number TEXT,
    to_number TEXT,
    agent_name TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vc.id,
        vc.direction,
        vc.status,
        vc.from_number,
        vc.to_number,
        va.name as agent_name,
        vc.duration_ms,
        vc.created_at
    FROM voice_calls vc
    LEFT JOIN voice_agents va ON vc.agent_id = va.id
    ORDER BY vc.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STORAGE BUCKET SETUP (run separately in Supabase dashboard or via API)
-- ============================================================================
--
-- Create bucket: voice-recordings
-- Settings:
--   - Public: false (private bucket)
--   - File size limit: 100MB
--   - Allowed MIME types: audio/wav, audio/mpeg, audio/webm, audio/ogg
--
-- RLS Policy for storage.objects:
--   - Service role can upload/download
--   - Authenticated users can download their own recordings
--
-- Example storage policy SQL (run in Supabase SQL editor):
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('voice-recordings', 'voice-recordings', false);
--
-- CREATE POLICY "Service role can manage voice recordings"
-- ON storage.objects FOR ALL
-- USING (bucket_id = 'voice-recordings' AND auth.role() = 'service_role');
--
-- ============================================================================

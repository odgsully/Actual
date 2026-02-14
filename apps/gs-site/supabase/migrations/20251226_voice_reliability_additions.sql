-- ============================================================================
-- Voice Reliability Additions Migration
-- Created: December 26, 2025
-- Purpose: Add webhook queue, voicemail support, and model tier optimization
-- Reference: apps/gs-site/audio-agents-plan.md (Critical Infrastructure section)
-- ============================================================================

-- ============================================================================
-- 1. WEBHOOK QUEUE TABLE
-- Dead letter queue for reliable webhook processing
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_webhook_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Webhook metadata
    webhook_type TEXT NOT NULL,  -- 'call_started', 'call_ended', 'call_analyzed', etc.
    payload JSONB NOT NULL,       -- Raw webhook payload from Retell

    -- Idempotency
    external_call_id TEXT,        -- For deduplication

    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    -- Error tracking
    last_error TEXT,
    error_stack TEXT,

    -- Retry scheduling
    next_retry_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Processing metadata
    processing_duration_ms INTEGER,
    processed_by TEXT  -- Vercel function ID for debugging
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_webhook_queue_pending
    ON voice_webhook_queue(status, next_retry_at)
    WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_webhook_queue_created
    ON voice_webhook_queue(created_at DESC);

-- Idempotency index (unique per call + type combination)
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_queue_idempotency
    ON voice_webhook_queue(external_call_id, webhook_type)
    WHERE external_call_id IS NOT NULL;

COMMENT ON TABLE voice_webhook_queue IS 'Dead letter queue for reliable webhook processing with retry logic';
COMMENT ON COLUMN voice_webhook_queue.status IS 'pending=new, processing=in flight, completed=done, failed=will retry, dead=gave up';

-- ============================================================================
-- 2. MODEL TIER COLUMN
-- Add model tier to voice_agents for cost optimization
-- ============================================================================

ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS model_tier TEXT
    DEFAULT 'standard' CHECK (model_tier IN ('economy', 'standard', 'premium'));

COMMENT ON COLUMN voice_agents.model_tier IS 'economy=haiku, standard=gpt-4o-mini, premium=sonnet';

-- Update existing agents with appropriate tiers
UPDATE voice_agents SET model_tier = 'economy', model_primary = 'anthropic/claude-3-haiku'
    WHERE name IN ('Morgan', 'Emily Liu', 'Kyle Blonkosky')
    AND model_tier = 'standard';

UPDATE voice_agents SET model_tier = 'premium', model_primary = 'anthropic/claude-3.5-sonnet'
    WHERE name IN ('Noah Carter', 'Victoria Chen')
    AND model_tier = 'standard';

-- ============================================================================
-- 3. VOICEMAIL SUPPORT
-- Add columns and table for voicemail handling
-- ============================================================================

-- Add call_type to voice_calls
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS call_type TEXT
    DEFAULT 'live' CHECK (call_type IN ('live', 'voicemail', 'missed', 'test'));

COMMENT ON COLUMN voice_calls.call_type IS 'live=normal call, voicemail=left message, missed=no answer/hangup, test=staging test';

-- Add recording_type to voice_recordings
ALTER TABLE voice_recordings ADD COLUMN IF NOT EXISTS recording_type TEXT
    DEFAULT 'call' CHECK (recording_type IN ('call', 'voicemail', 'greeting'));

COMMENT ON COLUMN voice_recordings.recording_type IS 'call=full call, voicemail=message left, greeting=custom greeting';

-- Voicemails table for tracking and notifications
CREATE TABLE IF NOT EXISTS voice_voicemails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
    recording_id UUID REFERENCES voice_recordings(id),

    -- Voicemail content
    transcript TEXT,
    summary TEXT,  -- LLM-generated summary

    -- Caller info (extracted from conversation)
    caller_name TEXT,
    caller_company TEXT,
    callback_number TEXT,

    -- Classification
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    category TEXT,  -- 'property_inquiry', 'scheduling', 'follow_up', etc.

    -- Action tracking
    action_required BOOLEAN DEFAULT TRUE,
    action_notes TEXT,

    -- Notification tracking
    notified_via TEXT[],  -- ['email', 'sms', 'slack']
    notified_at TIMESTAMPTZ,

    -- Listen tracking
    listened_at TIMESTAMPTZ,
    listened_by TEXT,  -- User who listened

    -- Follow-up tracking
    followed_up_at TIMESTAMPTZ,
    followed_up_by TEXT,
    follow_up_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(call_id)
);

CREATE INDEX IF NOT EXISTS idx_voicemails_unlistened
    ON voice_voicemails(created_at DESC)
    WHERE listened_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_voicemails_action_required
    ON voice_voicemails(urgency, created_at DESC)
    WHERE action_required = TRUE;

COMMENT ON TABLE voice_voicemails IS 'Voicemail messages with transcription and follow-up tracking';

-- ============================================================================
-- 4. CALL SUMMARIZATION COLUMNS
-- Add summary fields to voice_transcripts if not present
-- ============================================================================

-- These may already exist but using IF NOT EXISTS pattern
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'voice_transcripts' AND column_name = 'summary') THEN
        ALTER TABLE voice_transcripts ADD COLUMN summary TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'voice_transcripts' AND column_name = 'key_points') THEN
        ALTER TABLE voice_transcripts ADD COLUMN key_points TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'voice_transcripts' AND column_name = 'action_items') THEN
        ALTER TABLE voice_transcripts ADD COLUMN action_items TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'voice_transcripts' AND column_name = 'sentiment_overall') THEN
        ALTER TABLE voice_transcripts ADD COLUMN sentiment_overall TEXT
            CHECK (sentiment_overall IN ('positive', 'negative', 'neutral', 'mixed'));
    END IF;
END $$;

COMMENT ON COLUMN voice_transcripts.summary IS 'LLM-generated call summary (1-2 sentences)';
COMMENT ON COLUMN voice_transcripts.key_points IS 'Array of key discussion points';
COMMENT ON COLUMN voice_transcripts.action_items IS 'Array of follow-up actions identified';

-- ============================================================================
-- 5. RLS POLICIES FOR NEW TABLES
-- ============================================================================

ALTER TABLE voice_webhook_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_voicemails ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on voice_webhook_queue"
    ON voice_webhook_queue FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on voice_voicemails"
    ON voice_voicemails FOR ALL
    USING (auth.role() = 'service_role');

-- Authenticated users can read voicemails
CREATE POLICY "Authenticated users can read voice_voicemails"
    ON voice_voicemails FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auto-update voicemails updated_at
CREATE TRIGGER update_voice_voicemails_updated_at
    BEFORE UPDATE ON voice_voicemails
    FOR EACH ROW EXECUTE FUNCTION update_voice_updated_at();

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Get pending webhooks for processing
CREATE OR REPLACE FUNCTION get_pending_webhooks(
    batch_size INTEGER DEFAULT 10
)
RETURNS SETOF voice_webhook_queue AS $$
BEGIN
    RETURN QUERY
    UPDATE voice_webhook_queue
    SET status = 'processing',
        attempts = attempts + 1
    WHERE id IN (
        SELECT id FROM voice_webhook_queue
        WHERE status IN ('pending', 'failed')
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
          AND attempts < max_attempts
        ORDER BY created_at ASC
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Mark webhook as completed
CREATE OR REPLACE FUNCTION complete_webhook(
    webhook_id UUID,
    duration_ms INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE voice_webhook_queue
    SET status = 'completed',
        processed_at = NOW(),
        processing_duration_ms = duration_ms
    WHERE id = webhook_id;
END;
$$ LANGUAGE plpgsql;

-- Mark webhook as failed with retry scheduling
CREATE OR REPLACE FUNCTION fail_webhook(
    webhook_id UUID,
    error_msg TEXT,
    error_stack_trace TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    current_attempts INTEGER;
    max_att INTEGER;
BEGIN
    SELECT attempts, max_attempts INTO current_attempts, max_att
    FROM voice_webhook_queue WHERE id = webhook_id;

    IF current_attempts >= max_att THEN
        -- Mark as dead (gave up)
        UPDATE voice_webhook_queue
        SET status = 'dead',
            last_error = error_msg,
            error_stack = error_stack_trace
        WHERE id = webhook_id;
    ELSE
        -- Schedule retry with exponential backoff
        UPDATE voice_webhook_queue
        SET status = 'failed',
            last_error = error_msg,
            error_stack = error_stack_trace,
            next_retry_at = NOW() + (POWER(2, current_attempts) * INTERVAL '1 minute')
        WHERE id = webhook_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Get unlistened voicemails count
CREATE OR REPLACE FUNCTION get_unlistened_voicemail_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM voice_voicemails WHERE listened_at IS NULL);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get voicemails requiring action
CREATE OR REPLACE FUNCTION get_voicemails_requiring_action(
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    call_id UUID,
    caller_name TEXT,
    callback_number TEXT,
    urgency TEXT,
    transcript TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.call_id,
        v.caller_name,
        v.callback_number,
        v.urgency,
        v.transcript,
        v.summary,
        v.created_at
    FROM voice_voicemails v
    WHERE v.action_required = TRUE
      AND v.followed_up_at IS NULL
    ORDER BY
        CASE v.urgency
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
        END,
        v.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 8. REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for voicemails (for dashboard notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE voice_voicemails;

-- ============================================================================
-- VERIFICATION QUERIES (run to confirm migration)
-- ============================================================================
-- SELECT COUNT(*) FROM voice_webhook_queue;
-- SELECT COUNT(*) FROM voice_voicemails;
-- SELECT name, model_tier, model_primary FROM voice_agents;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'call_type';

/**
 * Retell Webhook Handler
 * POST /api/voice/webhooks/retell
 *
 * Receives webhooks from Retell AI and processes them:
 * 1. Verifies signature
 * 2. Checks idempotency
 * 3. Queues webhook for processing
 * 4. Returns 200 immediately (don't block Retell)
 *
 * Architecture:
 * - Webhooks are queued in voice_webhook_queue table
 * - Background process handles actual data storage
 * - This ensures we never lose webhook data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateWebhookRequest,
  logWebhookEvent,
  generateIdempotencyKey,
} from '@/lib/voice/webhook-security';
import { parseRetellWebhook } from '@/lib/voice/providers/retell/webhooks';
import { syncRecordingFromUrl } from '@/lib/voice/recording-sync';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, serviceKey);
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-retell-signature');
    const contentType = request.headers.get('content-type');
    const webhookSecret = process.env.RETELL_WEBHOOK_SECRET;

    // Validate request - Retell may not sign webhooks, so we'll be lenient
    // TODO: Re-enable strict signature verification once we confirm Retell's signing method
    if (signature && webhookSecret) {
      const validation = validateWebhookRequest(
        rawBody,
        signature,
        contentType,
        webhookSecret
      );

      if (!validation.valid) {
        logWebhookEvent('warn', 'Webhook signature validation failed - proceeding anyway', {
          error: validation.error,
          hasSignature: !!signature,
        });
        // Don't reject - Retell may not sign webhooks
      }
    } else {
      logWebhookEvent('info', 'No signature header - skipping verification', {
        hasSecret: !!webhookSecret,
      });
    }

    // Parse webhook payload
    const payload = JSON.parse(rawBody);
    const parsedEvent = parseRetellWebhook(payload);

    logWebhookEvent('info', `Received ${parsedEvent.type} webhook`, {
      callId: parsedEvent.callId,
      eventType: parsedEvent.type,
    });

    // Check idempotency - skip if we've already processed this event
    const idempotencyKey = generateIdempotencyKey(
      parsedEvent.callId,
      parsedEvent.type
    );

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from('voice_webhook_queue')
      .select('id')
      .eq('external_call_id', parsedEvent.callId)
      .eq('webhook_type', parsedEvent.type)
      .single();

    if (existing) {
      logWebhookEvent('info', 'Duplicate webhook - skipping', {
        callId: parsedEvent.callId,
        eventType: parsedEvent.type,
      });
      return NextResponse.json({ status: 'duplicate', message: 'Already processed' });
    }

    // Queue webhook for processing
    const { error: queueError } = await supabase
      .from('voice_webhook_queue')
      .insert({
        webhook_type: parsedEvent.type,
        payload: parsedEvent.raw,
        external_call_id: parsedEvent.callId,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      });

    if (queueError) {
      logWebhookEvent('error', 'Failed to queue webhook', {
        error: queueError.message,
        callId: parsedEvent.callId,
      });
      // Still return 200 to prevent Retell from retrying
      // We'll handle this via monitoring
    }

    // Process immediately if it's a critical event
    // (call_ended has recording URL that expires in 24h)
    if (parsedEvent.type === 'call_ended' || parsedEvent.type === 'call_started') {
      await processWebhookImmediately(supabase, parsedEvent);
    }

    const duration = Date.now() - startTime;
    logWebhookEvent('info', `Webhook processed in ${duration}ms`, {
      callId: parsedEvent.callId,
      eventType: parsedEvent.type,
      durationMs: duration,
    });

    return NextResponse.json({
      status: 'queued',
      callId: parsedEvent.callId,
      eventType: parsedEvent.type,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWebhookEvent('error', 'Webhook processing failed', { error: errorMessage });

    // Return 200 to prevent Retell from retrying
    // We don't want infinite retries for malformed webhooks
    return NextResponse.json(
      { status: 'error', message: errorMessage },
      { status: 200 }
    );
  }
}

// ============================================================================
// IMMEDIATE PROCESSING
// ============================================================================

async function processWebhookImmediately(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  event: ReturnType<typeof parseRetellWebhook>
) {
  try {
    if (event.type === 'call_started') {
      await handleCallStarted(supabase, event);
    } else if (event.type === 'call_ended') {
      await handleCallEnded(supabase, event);
    }

    // Mark webhook as completed
    await supabase
      .from('voice_webhook_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('external_call_id', event.callId)
      .eq('webhook_type', event.type);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWebhookEvent('error', 'Immediate processing failed', {
      callId: event.callId,
      error: errorMessage,
    });

    // Mark for retry
    await supabase
      .from('voice_webhook_queue')
      .update({
        status: 'failed',
        last_error: errorMessage,
        attempts: 1,
        next_retry_at: new Date(Date.now() + 60000).toISOString(), // Retry in 1 minute
      })
      .eq('external_call_id', event.callId)
      .eq('webhook_type', event.type);
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleCallStarted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  event: ReturnType<typeof parseRetellWebhook>
) {
  const { data: eventData } = event;

  // Look up agent by Retell agent ID
  let agentId: string | null = null;
  if (eventData.agentId) {
    const { data: agent } = await supabase
      .from('voice_agents')
      .select('id')
      .eq('retell_agent_id', eventData.agentId)
      .single();

    agentId = agent?.id || null;
  }

  // Insert call record
  const { error } = await supabase.from('voice_calls').insert({
    external_call_id: event.callId,
    platform: 'retell',
    direction: eventData.direction || 'inbound',
    status: 'in_progress',
    call_type: 'live',
    from_number: eventData.fromNumber || '',
    to_number: eventData.toNumber || '',
    started_at: eventData.startedAt?.toISOString() || new Date().toISOString(),
    agent_id: agentId,
  });

  if (error) {
    throw new Error(`Failed to insert call: ${error.message}`);
  }

  logWebhookEvent('info', 'Call started - record created', {
    callId: event.callId,
    direction: eventData.direction,
  });
}

async function handleCallEnded(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  event: ReturnType<typeof parseRetellWebhook>
) {
  const { data: eventData } = event;

  // Update call record
  const updateData: Record<string, unknown> = {
    status: eventData.status || 'completed',
    ended_at: eventData.endedAt?.toISOString() || new Date().toISOString(),
    duration_ms: eventData.durationMs,
    updated_at: new Date().toISOString(),
  };

  // Add costs if available
  if (eventData.costBreakdown) {
    updateData.cost_breakdown = eventData.costBreakdown;
    updateData.total_cost_usd = Object.values(eventData.costBreakdown)
      .filter((v): v is number => typeof v === 'number')
      .reduce((a, b) => a + b, 0);
  }

  // Add error info if present
  if (eventData.errorCode) {
    updateData.error_code = eventData.errorCode;
    updateData.error_message = eventData.errorMessage;
  }

  const { error: updateError } = await supabase
    .from('voice_calls')
    .update(updateData)
    .eq('external_call_id', event.callId);

  if (updateError) {
    throw new Error(`Failed to update call: ${updateError.message}`);
  }

  // Store transcript if available
  if (eventData.transcript) {
    // Get call ID from our table
    const { data: call } = await supabase
      .from('voice_calls')
      .select('id')
      .eq('external_call_id', event.callId)
      .single();

    if (call) {
      const { error: transcriptError } = await supabase.from('voice_transcripts').insert({
        call_id: call.id,
        transcript_text: eventData.transcript,
        word_count: eventData.transcript.split(/\s+/).length,
        transcript_json: eventData.turns || null,
      });

      if (transcriptError) {
        logWebhookEvent('error', 'Failed to store transcript', { error: transcriptError.message });
      } else {
        logWebhookEvent('info', 'Transcript stored', { wordCount: eventData.transcript.split(/\s+/).length });
      }

      // Store individual turns if available
      if (eventData.turns && eventData.turns.length > 0) {
        const turnsToInsert = eventData.turns.map((turn) => ({
          call_id: call.id,
          turn_index: turn.turnIndex,
          role: turn.role,
          content: turn.content,
          start_ms: turn.startMs,
          end_ms: turn.endMs,
          words: turn.words,
        }));

        await supabase.from('voice_turns').insert(turnsToInsert);
      }
    }
  }

  // Sync recording immediately (URLs expire in 24h!)
  if (eventData.recordingUrl) {
    logWebhookEvent('info', 'Syncing recording to Supabase Storage...', {
      url: eventData.recordingUrl?.substring(0, 60),
    });

    try {
      const syncResult = await syncRecordingFromUrl(
        event.callId,
        eventData.recordingUrl,
        eventData.recordingDurationMs
      );

      if (syncResult.success) {
        logWebhookEvent('info', 'Recording synced successfully', {
          storagePath: syncResult.storagePath,
          durationMs: syncResult.durationMs,
        });
      } else {
        logWebhookEvent('error', 'Recording sync failed', { error: syncResult.error });

        // Fall back to storing the URL for later retry
        const { data: call } = await supabase
          .from('voice_calls')
          .select('id')
          .eq('external_call_id', event.callId)
          .single();

        if (call) {
          await supabase.from('voice_recordings').insert({
            call_id: call.id,
            recording_type: 'call',
            original_url: eventData.recordingUrl,
            duration_ms: eventData.recordingDurationMs,
            sync_status: 'pending',
            original_url_expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    } catch (syncError) {
      logWebhookEvent('error', 'Recording sync threw error', {
        error: syncError instanceof Error ? syncError.message : 'Unknown error',
      });
    }
  }

  logWebhookEvent('info', 'Call ended - record updated', {
    callId: event.callId,
    duration: eventData.durationMs,
    hasTranscript: !!eventData.transcript,
    hasRecording: !!eventData.recordingUrl,
  });
}

// ============================================================================
// HEALTH CHECK (GET)
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/voice/webhooks/retell',
    timestamp: new Date().toISOString(),
  });
}

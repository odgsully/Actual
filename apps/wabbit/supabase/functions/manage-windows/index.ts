import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const ingestSecret = Deno.env.get('INGEST_SECRET')

    if (!ingestSecret || token !== ingestSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: collections, error: queryError } = await supabase
      .from('collections')
      .select('id, title, window_duration, current_window, created_at')
      .not('window_duration', 'is', null)

    if (queryError) {
      return new Response(
        JSON.stringify({ error: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!collections || collections.length === 0) {
      return new Response(
        JSON.stringify({ advanced: [], message: 'No collections with window_duration' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = Date.now()
    const advanced: { id: string; title: string; oldWindow: number; newWindow: number }[] = []

    for (const col of collections) {
      const durationMs = parseDurationMs(col.window_duration)
      if (durationMs <= 0) continue

      // Jump-to-correct-window: calculate what window we should be in based on elapsed time
      // Known limitation: if window_duration changes mid-collection, the calculation uses the
      // new duration retroactively against created_at. Would need a window_changed_at column to fix.
      const elapsed = now - new Date(col.created_at).getTime()
      const correctWindow = Math.floor(elapsed / durationMs) + 1

      if (correctWindow > col.current_window) {
        const oldWindow = col.current_window
        await supabase
          .from('collections')
          .update({ current_window: correctWindow })
          .eq('id', col.id)

        advanced.push({ id: col.id, title: col.title, oldWindow, newWindow: correctWindow })
      }
    }

    return new Response(
      JSON.stringify({
        advanced,
        checked: collections.length,
        message: advanced.length > 0
          ? `Advanced ${advanced.length} collection(s) to correct window`
          : 'No windows expired',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Parse PostgreSQL INTERVAL string to milliseconds.
 * Handles: "1 day", "2 hours", "30 minutes", "1 day 12:00:00", HH:MM:SS, raw seconds.
 */
function parseDurationMs(interval: string): number {
  let ms = 0

  const days = interval.match(/(\d+)\s*day/)
  if (days) ms += parseInt(days[1]) * 86400000

  const hours = interval.match(/(\d+)\s*hour/)
  if (hours) ms += parseInt(hours[1]) * 3600000

  const minutes = interval.match(/(\d+)\s*min/)
  if (minutes) ms += parseInt(minutes[1]) * 60000

  const hms = interval.match(/(\d+):(\d+):(\d+)/)
  if (hms) {
    ms += parseInt(hms[1]) * 3600000
    ms += parseInt(hms[2]) * 60000
    ms += parseInt(hms[3]) * 1000
  }

  if (ms === 0) {
    const secs = parseInt(interval)
    if (!isNaN(secs)) ms = secs * 1000
  }

  return ms
}

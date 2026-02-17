import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IngestRecord {
  title: string
  description?: string
  metadata?: {
    sourceUrl?: string
    sourceApi?: string
    generationPrompt?: string
    [key: string]: unknown
  }
}

interface IngestPayload {
  collectionId: string
  records: IngestRecord[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate bearer token
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const ingestSecret = Deno.env.get('INGEST_SECRET')

    if (!ingestSecret || token !== ingestSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: IngestPayload = await req.json()

    // Validate payload
    if (!payload.collectionId || !payload.records || !Array.isArray(payload.records)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: collectionId, records[]' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (payload.records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'records array must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    for (const record of payload.records) {
      if (!record.title || typeof record.title !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Each record must have a title string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Admin client (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify collection exists and get current window
    const { data: collection, error: collError } = await supabase
      .from('collections')
      .select('id, current_window, output_type')
      .eq('id', payload.collectionId)
      .single()

    if (collError || !collection) {
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build record rows
    const rows = payload.records.map((record) => ({
      collection_id: payload.collectionId,
      title: record.title,
      description: record.description || null,
      metadata: record.metadata || {},
      window_number: collection.current_window,
    }))

    // Insert records
    const { data: created, error: insertError } = await supabase
      .from('records')
      .insert(rows)
      .select('id')

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        recordIds: created?.map((r: { id: string }) => r.id) ?? [],
        windowNumber: collection.current_window,
        count: created?.length ?? 0,
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

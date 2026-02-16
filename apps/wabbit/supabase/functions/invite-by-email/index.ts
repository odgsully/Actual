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
    const { collection_id, email, role } = await req.json()

    if (!collection_id || !email || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: collection_id, email, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['contributor', 'viewer'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Role must be contributor or viewer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin client for user lookup (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticated client for permission check
    const authHeader = req.headers.get('Authorization')
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    )

    // Verify the caller is the collection owner
    const { data: { user: caller } } = await supabaseAuth.auth.getUser()
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: callerCollab } = await supabaseAdmin
      .from('collaborators')
      .select('role')
      .eq('collection_id', collection_id)
      .eq('user_id', caller.id)
      .single()

    if (callerCollab?.role !== 'owner') {
      return new Response(
        JSON.stringify({ error: 'Only the collection owner can invite collaborators' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Look up user by email (requires admin access)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      return new Response(
        JSON.stringify({ error: 'Failed to look up users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetUser = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'No user found with that email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already a collaborator
    const { data: existing } = await supabaseAdmin
      .from('collaborators')
      .select('id')
      .eq('collection_id', collection_id)
      .eq('user_id', targetUser.id)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'User is already a collaborator on this Wabb' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the collaborator (pending — accepted_at is null)
    const { data: collaborator, error: insertError } = await supabaseAdmin
      .from('collaborators')
      .insert({
        collection_id,
        user_id: targetUser.id,
        role,
      })
      .select()
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ collaborator }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

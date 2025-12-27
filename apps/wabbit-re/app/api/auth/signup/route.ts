import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'

function getSupabaseAdmin() {
  // Create a Supabase client with the service role key to bypass RLS
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 signup attempts per minute per IP
  const rateLimitResult = await rateLimiters.auth.check(request)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { userId, email, firstName, lastName, privacyAccepted, marketingOptIn } = await request.json()

    // Create the user profile using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: email,
        first_name: firstName || '',
        last_name: lastName || '',
        privacy_accepted: privacyAccepted || false,
        marketing_opt_in: marketingOptIn || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Profile creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
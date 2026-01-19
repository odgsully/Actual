import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const VALID_TYPES = ['call', 'email', 'meeting', 'text', 'other'] as const
const VALID_OUTCOMES = [
  'interested',
  'not_interested',
  'follow_up',
  'left_voicemail',
  'no_answer',
  'scheduled',
  'completed',
] as const

// POST /api/admin/outreach - Log new outreach activity
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { client_id, type, notes, outcome, duration_minutes } = body

    // Validate required fields
    if (!client_id) {
      return NextResponse.json(
        { success: false, error: 'Client is required' },
        { status: 400 }
      )
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Valid activity type is required' },
        { status: 400 }
      )
    }

    // Validate outcome if provided
    if (outcome && !VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json(
        { success: false, error: 'Invalid outcome value' },
        { status: 400 }
      )
    }

    // Validate duration if provided
    if (duration_minutes !== undefined && duration_minutes !== null) {
      const duration = parseInt(duration_minutes)
      if (isNaN(duration) || duration < 1 || duration > 480) {
        return NextResponse.json(
          { success: false, error: 'Duration must be between 1 and 480 minutes' },
          { status: 400 }
        )
      }
    }

    // Verify client exists
    const { data: clientData, error: clientError } = await supabase
      .from('gsrealty_clients')
      .select('id')
      .eq('id', client_id)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 400 }
      )
    }

    // Create outreach entry
    const { data: outreach, error: insertError } = await supabase
      .from('gsrealty_outreach')
      .insert({
        client_id,
        type,
        notes: notes || null,
        outcome: outcome || null,
        duration_minutes: duration_minutes ? parseInt(duration_minutes) : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating outreach:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to log activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: outreach,
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/outreach - Fetch outreach records
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const limitParam = searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '20'), 50)

    // Build query
    let query = supabase
      .from('gsrealty_outreach')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by client if specified
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: outreach, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching outreach:', queryError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: outreach || [],
    })

  } catch (error) {
    console.error('Error in GET /api/admin/outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/outreach - Delete outreach record
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get outreach ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Outreach ID is required' },
        { status: 400 }
      )
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('gsrealty_outreach')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting outreach:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

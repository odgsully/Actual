import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/admin/events - Create new event entry
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

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
    const { title, tags, body: eventBody, clientId } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create event entry
    const { data: event, error: insertError } = await supabase
      .from('gsrealty_event_entries')
      .insert({
        title,
        tags: tags || [],
        body: eventBody || '',
        client_id: clientId || null,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating event:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create event' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: event
    })

  } catch (error) {
    console.error('Error in POST /api/admin/events:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/events - List all events (admin view)
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

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
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('gsrealty_event_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by client if specified
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: events, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching events:', queryError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: events || []
    })

  } catch (error) {
    console.error('Error in GET /api/admin/events:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

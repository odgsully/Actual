import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/events - List events visible to current user (RLS handles permissions)
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

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch events (RLS policies will filter appropriately)
    const { data: events, error: queryError } = await supabase
      .from('gsrealty_event_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

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
    console.error('Error in GET /api/events:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

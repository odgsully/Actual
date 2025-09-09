import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's search areas with property counts
    const { data, error } = await supabase.rpc('get_user_search_areas_with_counts', {
      p_user_id: user.id
    })

    if (error) {
      console.error('Error fetching search areas:', error)
      return NextResponse.json(
        { error: 'Failed to fetch search areas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      areas: data || []
    })
  } catch (error) {
    console.error('Error in list areas API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
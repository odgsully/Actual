import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      area_name,
      area_type,
      geojson,
      bounds,
      center_point,
      is_inclusion = true,
      color = '#3B82F6',
      opacity = 0.3,
      area_id = null
    } = body

    // Validate required fields
    if (!area_name || !area_type || !geojson || !bounds) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save the search area using RPC function
    const { data, error } = await supabase.rpc('save_search_area', {
      p_area_name: area_name,
      p_area_type: area_type,
      p_geojson: geojson,
      p_bounds: bounds,
      p_center_point: center_point || null,
      p_is_inclusion: is_inclusion,
      p_color: color,
      p_opacity: opacity,
      p_area_id: area_id
    })

    if (error) {
      console.error('Error saving search area:', error)
      return NextResponse.json(
        { error: 'Failed to save search area' },
        { status: 500 }
      )
    }

    // Get the full area details with counts
    const { data: areaWithCounts, error: fetchError } = await supabase.rpc(
      'get_user_search_areas_with_counts',
      { p_user_id: user.id }
    )

    if (fetchError) {
      console.error('Error fetching area with counts:', fetchError)
      return NextResponse.json({ success: true, area_id: data })
    }

    // Find the newly created/updated area
    const savedArea = areaWithCounts?.find((a: any) => a.id === data)

    return NextResponse.json({
      success: true,
      area_id: data,
      area: savedArea || null
    })
  } catch (error) {
    console.error('Error in save area API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
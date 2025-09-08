import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { area_id, action, ...updateData } = body

    if (!area_id) {
      return NextResponse.json(
        { error: 'Area ID is required' },
        { status: 400 }
      )
    }

    // Handle different update actions
    if (action === 'toggle_active') {
      // Toggle active status
      const { data, error } = await supabase.rpc('toggle_search_area_active', {
        p_area_id: area_id
      })

      if (error) {
        console.error('Error toggling area active:', error)
        return NextResponse.json(
          { error: 'Failed to toggle area status' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        is_active: data
      })
    } else {
      // General update
      const { data, error } = await supabase
        .from('user_search_areas')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', area_id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating search area:', error)
        return NextResponse.json(
          { error: 'Failed to update search area' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        area: data
      })
    }
  } catch (error) {
    console.error('Error in update area API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get area ID from URL or body
    const { searchParams } = new URL(request.url)
    const areaId = searchParams.get('id')

    if (!areaId) {
      return NextResponse.json(
        { error: 'Area ID is required' },
        { status: 400 }
      )
    }

    // Delete the search area using RPC function
    const { data, error } = await supabase.rpc('delete_search_area', {
      p_area_id: areaId
    })

    if (error) {
      console.error('Error deleting search area:', error)
      return NextResponse.json(
        { error: 'Failed to delete search area' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: data
    })
  } catch (error) {
    console.error('Error in delete area API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
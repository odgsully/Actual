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
    const { area_ids, include_excluded = false } = body

    // Get properties filtered by search areas
    const { data, error } = await supabase.rpc('get_properties_in_areas', {
      p_user_id: user.id,
      p_area_ids: area_ids || null,
      p_include_excluded: include_excluded
    })

    if (error) {
      console.error('Error fetching properties in areas:', error)
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      )
    }

    // Filter results based on inclusion/exclusion logic
    const filteredProperties = (data || []).filter((property: any) => {
      // Include properties that are in inclusion areas and not in exclusion areas
      // Unless include_excluded is true
      if (include_excluded) {
        return property.in_inclusion_area
      }
      return property.in_inclusion_area && !property.in_exclusion_area
    })

    return NextResponse.json({
      success: true,
      properties: filteredProperties,
      total: filteredProperties.length
    })
  } catch (error) {
    console.error('Error in spatial properties API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Get property with area information
    const { data, error } = await supabase.rpc('get_property_with_areas', {
      p_property_id: propertyId
    })

    if (error) {
      console.error('Error fetching property with areas:', error)
      return NextResponse.json(
        { error: 'Failed to fetch property' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      property: data[0].property,
      search_areas: data[0].search_areas || []
    })
  } catch (error) {
    console.error('Error in property areas API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
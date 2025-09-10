import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Map form values to database values for consistent storage
    const mapHomeStyle = (style: string) => {
      if (style === 'Single-story') return 'single-story'
      if (style === 'Multi-level') return 'multi-level'
      return style?.toLowerCase() || null
    }

    const mapPoolPreference = (pref: string) => {
      if (pref === 'Yes') return 'yes'
      if (pref === 'No') return 'no'
      if (pref === 'Neutral') return 'neutral'
      return pref?.toLowerCase() || 'neutral'
    }

    const mapHoaPreference = (pref: string) => {
      if (pref === 'No HOA') return 'no_hoa'
      if (pref === 'HOA only') return 'hoa_only'
      if (pref === 'No preference') return 'no_preference'
      return 'no_preference'
    }

    // Prepare preferences data with correct column names
    const preferencesData = {
      user_id: user.id,
      property_type: body.propertyType,
      min_square_footage: parseInt(body.minSquareFootage?.replace(/[^\d]/g, '')) || null,
      min_lot_square_footage: parseInt(body.minLotSize?.replace(/[^\d]/g, '')) || null,
      price_range_min: parseFloat(body.priceMin?.replace(/[^\d.]/g, '')) || null,
      price_range_max: parseFloat(body.priceMax?.replace(/[^\d.]/g, '')) || null,
      commute_address_1: body.commuteAddress1,
      commute_max_minutes_1: parseInt(body.commuteMinutes1) || null,
      commute_address_2: body.commuteAddress2,
      commute_max_minutes_2: parseInt(body.commuteMinutes2) || null,
      bedrooms_needed: parseInt(body.bedrooms) || 0,
      bathrooms_needed: parseFloat(body.bathrooms) || 0,
      city_preferences: body.cities || [],
      preferred_zip_codes: body.zipCodes?.split(',').map((z: string) => z.trim()).filter((z: string) => z) || [],
      home_style: mapHomeStyle(body.homeStyle),
      pool_preference: mapPoolPreference(body.pool),
      min_garage_spaces: parseInt(body.garageSpaces) || 0,
      hoa_preference: mapHoaPreference(body.hoa),
      renovation_openness: parseInt(body.renovations) || 3,
      current_residence_address: body.currentAddress,
      current_residence_works_well: body.worksWell,
      current_residence_doesnt_work: body.doesntWork,
      updated_at: new Date().toISOString()
    }

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('buyer_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    if (existing) {
      // Update existing preferences
      result = await supabase
        .from('buyer_preferences')
        .update(preferencesData)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      // Insert new preferences
      result = await supabase
        .from('buyer_preferences')
        .insert(preferencesData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving preferences:', result.error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true, preferences: result.data })
  } catch (error) {
    console.error('Error in preferences save:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
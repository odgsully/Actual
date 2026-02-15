import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('[API/preferences/load] User:', user?.email, 'ID:', user?.id)
    
    if (userError || !user) {
      console.error('[API/preferences/load] Auth error:', userError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Load preferences from database
    console.log('[API/preferences/load] Fetching preferences for user_id:', user.id)
    const { data: preferences, error } = await supabase
      .from('buyer_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('[API/preferences/load] Query result:', { 
      hasData: !!preferences, 
      error: error?.message,
      errorCode: error?.code 
    })

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[API/preferences/load] Database error:', error)
      return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
    }

    // If no preferences exist and this is the demo account, create default preferences
    if (!preferences && user.email === 'support@wabbit-rank.ai') {
      console.log('[API/preferences/load] No preferences for demo account, creating defaults...')
      const defaultDemoPrefs = {
        user_id: user.id,
        property_type: 'Single Family',
        min_square_footage: 2000,
        min_lot_square_footage: 8000,
        price_range_min: 600000,
        price_range_max: 1200000,
        commute_address_1: '7525 E Gainey Ranch Rd, Scottsdale, AZ',
        commute_max_minutes_1: 30,
        bedrooms_needed: 3,
        bathrooms_needed: 2,
        city_preferences: ['Scottsdale', 'Paradise Valley'],
        preferred_zip_codes: ['85251', '85253'],
        home_style: 'single-story',
        pool_preference: 'Yes',
        min_garage_spaces: 2,
        hoa_preference: 'No preference',
        renovation_openness: 3,
        current_residence_address: '123 Current St, Phoenix, AZ',
        current_residence_works_well: 'Great location, good schools',
        current_residence_doesnt_work: 'Too small, needs updates',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert demo preferences
      const { data: newPrefs, error: insertError } = await supabase
        .from('buyer_preferences')
        .insert(defaultDemoPrefs)
        .select()
        .single()

      if (insertError) {
        console.error('[API/preferences/load] Error creating demo preferences:', insertError)
        // Return the default preferences even if insert fails
        console.log('[API/preferences/load] Returning default demo preferences despite insert error')
        return NextResponse.json({ preferences: defaultDemoPrefs })
      }

      console.log('[API/preferences/load] Successfully created demo preferences')
      return NextResponse.json({ preferences: newPrefs })
    }

    console.log('[API/preferences/load] Returning preferences:', preferences ? 'Found' : 'Empty')
    return NextResponse.json({ preferences: preferences || {} })
  } catch (error) {
    console.error('Error in preferences load:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
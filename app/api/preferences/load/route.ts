import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Load preferences from database
    const { data: preferences, error } = await supabase
      .from('buyer_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error loading preferences:', error)
      return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
    }

    // For demo account, return sample preferences with correct field names
    if (user.email === 'support@wabbit-rank.ai' && !preferences) {
      return NextResponse.json({
        preferences: {
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
          pool_preference: 'yes',
          min_garage_spaces: 2,
          hoa_preference: 'neutral',
          renovation_openness: 3,
          current_residence_address: '123 Current St, Phoenix, AZ',
          current_residence_works_well: 'Great location, good schools',
          current_residence_doesnt_work: 'Too small, needs updates'
        }
      })
    }

    return NextResponse.json({ preferences: preferences || {} })
  } catch (error) {
    console.error('Error in preferences load:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
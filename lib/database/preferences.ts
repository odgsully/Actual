import { createClient } from '@/lib/supabase/client'

export interface BuyerPreferences {
  property_type?: string
  min_square_footage?: number
  min_lot_square_footage?: number
  price_range_min?: number
  price_range_max?: number
  commute_address_1?: string
  commute_max_minutes_1?: number
  commute_address_2?: string
  commute_max_minutes_2?: number
  commute_address_3?: string
  commute_max_minutes_3?: number
  bedrooms_needed?: number
  bathrooms_needed?: number
  city_preferences?: string[]
  preferred_zip_codes?: string[]
  home_style?: string
  pool_preference?: string
  min_garage_spaces?: number
  hoa_preference?: string
  renovation_openness?: number
  current_residence_address?: string
  current_residence_works_well?: string
  current_residence_doesnt_work?: string
}

export async function getUserPreferences(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buyer_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user preferences:', error)
  }
  
  return data
}

export async function saveUserPreferences(userId: string, preferences: BuyerPreferences) {
  const supabase = createClient()
  
  // Check if preferences already exist
  const existing = await getUserPreferences(userId)
  
  if (existing) {
    // Update existing preferences
    const { data, error } = await supabase
      .from('buyer_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating preferences:', error)
      return null
    }
    
    return data
  } else {
    // Create new preferences
    const { data, error } = await supabase
      .from('buyer_preferences')
      .insert({
        user_id: userId,
        ...preferences,
        form_version: 1,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating preferences:', error)
      return null
    }
    
    return data
  }
}

export async function calculatePropertyMatchScore(propertyId: string, userId: string) {
  const supabase = createClient()
  
  // Use the database function to calculate match score
  const { data, error } = await supabase
    .rpc('calculate_property_match_score', {
      p_property_id: propertyId,
      p_user_id: userId
    })
  
  if (error) {
    console.error('Error calculating match score:', error)
    return 0
  }
  
  return data || 0
}
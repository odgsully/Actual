import { createClient } from '@/lib/supabase/client'

export async function getUserProperties(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_properties')
    .select(`
      *,
      property:properties(*)
    `)
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error fetching user properties:', error)
    return []
  }
  
  return data.map(item => ({
    ...item.property,
    is_favorite: item.is_favorite,
    source: item.source
  }))
}

export async function getProperty(propertyId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()
  
  if (error) {
    console.error('Error fetching property:', error)
    return null
  }
  
  return data
}

export async function toggleFavorite(userId: string, propertyId: string) {
  const supabase = createClient()
  
  // First check if the user_property relationship exists
  const { data: existing } = await supabase
    .from('user_properties')
    .select('is_favorite')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single()
  
  if (existing) {
    // Update existing favorite status
    const { error } = await supabase
      .from('user_properties')
      .update({ is_favorite: !existing.is_favorite })
      .eq('user_id', userId)
      .eq('property_id', propertyId)
    
    if (error) {
      console.error('Error toggling favorite:', error)
      return false
    }
    
    return true
  } else {
    // Create new user_property relationship
    const { error } = await supabase
      .from('user_properties')
      .insert({
        user_id: userId,
        property_id: propertyId,
        is_favorite: true,
        source: 'manual'
      })
    
    if (error) {
      console.error('Error creating favorite:', error)
      return false
    }
    
    return true
  }
}
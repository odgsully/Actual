import { createClient } from '@/lib/supabase/client'

export interface Ranking {
  price_value_score: number
  location_score: number
  layout_score: number
  turnkey_score: number
  notes?: string
}

export async function getUserRankings(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('rankings')
    .select(`
      *,
      property:properties(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user rankings:', error)
    return []
  }
  
  return data
}

export async function getPropertyRanking(userId: string, propertyId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('rankings')
    .select('*')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching property ranking:', error)
  }
  
  return data
}

export async function saveRanking(userId: string, propertyId: string, ranking: Ranking) {
  const supabase = createClient()
  
  // Check if ranking already exists
  const existing = await getPropertyRanking(userId, propertyId)
  
  if (existing) {
    // Update existing ranking
    const { data, error } = await supabase
      .from('rankings')
      .update(ranking)
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating ranking:', error)
      return null
    }
    
    return data
  } else {
    // Create new ranking
    const { data, error } = await supabase
      .from('rankings')
      .insert({
        user_id: userId,
        property_id: propertyId,
        ...ranking
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating ranking:', error)
      return null
    }
    
    return data
  }
}

export async function getCollaborativeRankings(sharedAccountId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collaborative_rankings')
    .select('*')
    .eq('shared_account_id', sharedAccountId)
    .order('avg_overall_score', { ascending: false })
  
  if (error) {
    console.error('Error fetching collaborative rankings:', error)
    return []
  }
  
  return data
}
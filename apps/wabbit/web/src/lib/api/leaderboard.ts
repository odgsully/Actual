import { supabase } from '@/lib/supabase'

export async function getLeaderboard(collectionId: string) {
  return supabase
    .from('collection_leaderboard')
    .select('*')
    .eq('collection_id', collectionId)
    .order('avg_score', { ascending: false })
}

export async function getRecordChoices(recordId: string) {
  return supabase.from('record_choices').select('*').eq('record_id', recordId)
}

export async function getProgressView(userId: string) {
  return supabase.from('user_progress').select('*').eq('user_id', userId)
}

import { supabase } from '@/lib/supabase'

export async function submitRanking(data: {
  userId: string
  recordId: string
  collectionId: string
  score?: number
  choice?: string
}) {
  return supabase.from('rankings').upsert(
    {
      user_id: data.userId,
      record_id: data.recordId,
      collection_id: data.collectionId,
      score: data.score ?? null,
      choice: data.choice ?? null,
    },
    { onConflict: 'user_id,record_id' }
  )
}

export async function getUserRankings(collectionId: string, userId: string) {
  return supabase
    .from('rankings')
    .select('record_id, score, choice')
    .eq('collection_id', collectionId)
    .eq('user_id', userId)
}

export async function getRecordRankings(recordId: string) {
  return supabase
    .from('rankings')
    .select('*')
    .eq('record_id', recordId)
}

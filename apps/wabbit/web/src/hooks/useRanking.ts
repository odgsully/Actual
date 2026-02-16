import { useState } from 'react'
import { submitRanking as submitRankingApi } from '@/lib/api/rankings'
import { useAuth } from '@/hooks/useAuth'

export function useRanking(collectionId: string | undefined) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  async function submitScore(recordId: string, score: number) {
    if (!user || !collectionId) return
    setSubmitting(true)
    const result = await submitRankingApi({
      userId: user.id,
      recordId,
      collectionId,
      score,
    })
    setSubmitting(false)
    return result
  }

  async function submitChoice(recordId: string, choice: string) {
    if (!user || !collectionId) return
    setSubmitting(true)
    const result = await submitRankingApi({
      userId: user.id,
      recordId,
      collectionId,
      choice,
    })
    setSubmitting(false)
    return result
  }

  return { submitScore, submitChoice, submitting }
}

import { useEffect, useState } from 'react'
import { getProgressView } from '@/lib/api/leaderboard'
import { useAuth } from '@/hooks/useAuth'

interface ProgressEntry {
  collection_id: string
  total_records: number
  ranked_records: number
  completion_pct: number
}

export function useProgress() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<Map<string, ProgressEntry>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    getProgressView(user.id).then(({ data }) => {
      const map = new Map<string, ProgressEntry>()
      for (const entry of data ?? []) {
        if (!entry.collection_id) continue
        map.set(entry.collection_id, {
          collection_id: entry.collection_id,
          total_records: Number(entry.total_records ?? 0),
          ranked_records: Number(entry.ranked_records ?? 0),
          completion_pct: Number(entry.completion_pct ?? 0),
        })
      }
      setProgress(map)
      setLoading(false)
    })
  }, [user])

  return { progress, loading }
}

import { useEffect, useState } from 'react'
import { getCollection } from '@/lib/api/collections'
import { getRecords } from '@/lib/api/records'
import { getUserRankings } from '@/lib/api/rankings'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/types/database'

type Collection = Database['public']['Tables']['collections']['Row']
type Record = Database['public']['Tables']['records']['Row']
type Ranking = { record_id: string; score: number | null; choice: string | null }

export function useCollection(collectionId: string | undefined) {
  const { user } = useAuth()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [userRankings, setUserRankings] = useState<Map<string, Ranking>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!collectionId || !user) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      setError(null)

      const [collRes, recRes, rankRes] = await Promise.all([
        getCollection(collectionId!),
        getRecords(collectionId!),
        getUserRankings(collectionId!, user!.id),
      ])

      if (collRes.error) {
        setError(collRes.error.message)
        setLoading(false)
        return
      }

      setCollection(collRes.data)
      setRecords(recRes.data ?? [])

      const rankMap = new Map<string, Ranking>()
      for (const r of rankRes.data ?? []) {
        rankMap.set(r.record_id, r)
      }
      setUserRankings(rankMap)
      setLoading(false)
    }

    load()
  }, [collectionId, user])

  const firstUnrankedIndex = records.findIndex(
    (r) => !userRankings.has(r.id)
  )

  const rankedCount = userRankings.size
  const totalCount = records.length
  const allRanked = totalCount > 0 && rankedCount >= totalCount

  return {
    collection,
    records,
    userRankings,
    loading,
    error,
    firstUnrankedIndex: firstUnrankedIndex === -1 ? records.length : firstUnrankedIndex,
    rankedCount,
    totalCount,
    allRanked,
    reload: () => {
      if (collectionId && user) {
        getUserRankings(collectionId, user.id).then(({ data }) => {
          const rankMap = new Map<string, Ranking>()
          for (const r of data ?? []) {
            rankMap.set(r.record_id, r)
          }
          setUserRankings(rankMap)
        })
      }
    },
  }
}

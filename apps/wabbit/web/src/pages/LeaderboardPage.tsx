import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getLeaderboard } from '@/lib/api/leaderboard'
import { getCollection } from '@/lib/api/collections'
import type { Database } from '@/types/database'

type Collection = Database['public']['Tables']['collections']['Row']

interface LeaderboardEntry {
  record_id: string
  title: string
  avg_score: number
  rank_count: number
  rank: number
}

export function LeaderboardPage() {
  const { id } = useParams<{ id: string }>()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    async function load() {
      const [collRes, lbRes] = await Promise.all([
        getCollection(id!),
        getLeaderboard(id!),
      ])

      setCollection(collRes.data)
      setEntries(
        (lbRes.data ?? []).map((row: Record<string, unknown>, i: number) => ({
          record_id: row.record_id as string,
          title: row.title as string,
          avg_score: Number(row.avg_score ?? 0),
          rank_count: Number(row.rank_count ?? 0),
          rank: i + 1,
        }))
      )
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-white/40">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          {collection?.title ?? 'Leaderboard'}
        </h2>
        <Link
          to={`/wabb/${id}`}
          className="text-sm text-white/40 hover:text-white/80 transition-colors duration-700"
        >
          Back to ranking
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-white/60">No rankings yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.record_id}
              className="glass-card flex items-center gap-4 px-5 py-4"
            >
              {/* Rank */}
              <span
                className={`text-2xl font-bold w-10 text-center flex-shrink-0 ${
                  entry.rank === 1
                    ? 'text-yellow-400'
                    : entry.rank === 2
                      ? 'text-white/60'
                      : entry.rank === 3
                        ? 'text-amber-600'
                        : 'text-white/30'
                }`}
              >
                {entry.rank}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.title}</p>
                <p className="text-xs text-white/30">
                  {entry.rank_count} vote{entry.rank_count !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <span className="text-xl font-bold tabular-nums">
                  {entry.avg_score.toFixed(1)}
                </span>
                <span className="text-xs text-white/30 ml-1">/10</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

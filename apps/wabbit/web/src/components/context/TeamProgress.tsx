import { useRef } from 'react'
import { useRealtime } from '@/hooks/useRealtime'

interface Collaborator {
  user_id: string
  role: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface RecordRanking {
  user_id: string
  score: number | null
  choice: string | null
}

interface Props {
  collectionId: string
  collaborators: Collaborator[]
  totalRecords: number
  /** Map of user_id → ranked count */
  rankingCounts: Map<string, number>
  /** Current record's rankings from all team members */
  currentRecordRankings?: RecordRanking[]
  onRankingCountsChange?: (counts: Map<string, number>) => void
}

export function TeamProgress({
  collectionId,
  collaborators,
  totalRecords,
  rankingCounts,
  currentRecordRankings,
  onRankingCountsChange,
}: Props) {
  // Track counts internally via ref to avoid stale closure over rankingCounts prop
  const countsRef = useRef(rankingCounts)
  countsRef.current = rankingCounts

  // Live updates: increment ranking counts on INSERT only (upsert fires INSERT on first ranking)
  useRealtime(
    'rankings',
    `collection_id=eq.${collectionId}`,
    (payload) => {
      if (onRankingCountsChange && payload.eventType === 'INSERT') {
        const userId = (payload.new as { user_id: string }).user_id
        const updated = new Map(countsRef.current)
        updated.set(userId, (updated.get(userId) ?? 0) + 1)
        onRankingCountsChange(updated)
      }
    }
  )

  if (collaborators.length === 0) {
    return (
      <div className="glass-card p-4">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          Team
        </h4>
        <p className="text-white/30 text-sm">Solo Wabb — no collaborators.</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
        Team Progress
      </h4>
      <div className="space-y-3">
        {collaborators.map((c) => {
          const name = c.profiles?.display_name ?? c.user_id.slice(0, 8)
          const avatar = c.profiles?.avatar_url
          const ranked = rankingCounts.get(c.user_id) ?? 0
          const pct = totalRecords > 0 ? Math.round((ranked / totalRecords) * 100) : 0
          const isViewer = c.role === 'viewer'

          return (
            <div key={c.user_id} className="space-y-1">
              <div className="flex items-center gap-2">
                {avatar ? (
                  <img src={avatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] flex-shrink-0">
                    {name[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-sm text-white/80 truncate flex-1">{name}</span>
                {isViewer ? (
                  <span className="text-[10px] text-white/30">View only</span>
                ) : (
                  <span className="text-xs text-white/40 tabular-nums">{pct}%</span>
                )}
              </div>
              {!isViewer && (
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/30 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Current record scores from team */}
      {currentRecordRankings && currentRecordRankings.length > 0 && (
        <div className="pt-3 mt-3 border-t border-white/10">
          <h5 className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
            Current Record
          </h5>
          <div className="space-y-1.5">
            {currentRecordRankings.map((r) => {
              const collab = collaborators.find((c) => c.user_id === r.user_id)
              const name = collab?.profiles?.display_name ?? r.user_id.slice(0, 8)
              const display =
                r.score != null
                  ? r.score.toFixed(1)
                  : r.choice != null
                    ? r.choice
                    : '—'

              return (
                <div key={r.user_id} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{name}</span>
                  <span className="text-white/80 tabular-nums font-medium">{display}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

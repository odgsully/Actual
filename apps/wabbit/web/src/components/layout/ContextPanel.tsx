import { useEffect, useState } from 'react'
import { useLayoutStore } from '@/stores/layoutStore'
import { getCollection } from '@/lib/api/collections'
import { getCollaborators } from '@/lib/api/collaborators'
import { useRealtime } from '@/hooks/useRealtime'
import { RAVGDisplay } from '@/components/context/RAVGDisplay'
import { TeamProgress } from '@/components/context/TeamProgress'
import { WabbStats } from '@/components/context/WabbStats'
import type { Database } from '@/types/database'

type Collection = Database['public']['Tables']['collections']['Row']

interface Collaborator {
  user_id: string
  role: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

export function ContextPanel() {
  const { activeWabbId } = useLayoutStore()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [rankingCounts] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeWabbId) {
      setCollection(null)
      setCollaborators([])
      return
    }

    setLoading(true)
    Promise.all([
      getCollection(activeWabbId),
      getCollaborators(activeWabbId),
    ]).then(([collRes, collabRes]) => {
      setCollection(collRes.data)
      setCollaborators((collabRes.data ?? []) as unknown as Collaborator[])
      setLoading(false)
    })
  }, [activeWabbId])

  // Live ranking updates — debounced to prevent rapid getCollaborators calls
  useRealtime(
    'rankings',
    activeWabbId ? `collection_id=eq.${activeWabbId}` : undefined,
    () => {
      if (activeWabbId) {
        getCollaborators(activeWabbId).then(({ data }) => {
          setCollaborators((data ?? []) as unknown as Collaborator[])
        })
      }
    },
    { debounceMs: 500 }
  )

  if (!activeWabbId) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-4">Details</h3>
        <div className="glass-card p-4">
          <p className="text-white/30 text-sm">
            Select a Wabb to see details, RAVG scores, and team progress.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-white/5 rounded-3xl" />
          <div className="h-32 bg-white/5 rounded-3xl" />
          <div className="h-20 bg-white/5 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!collection) return null

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-medium text-white/60">Details</h3>

      {/* NOTE: RAVGDisplay receives `collection` as single prop but expects destructured props — pre-existing bug, document for next sprint */}
      <RAVGDisplay collection={collection} />

      <TeamProgress
        collectionId={activeWabbId!}
        collaborators={collaborators}
        totalRecords={0}
        rankingCounts={rankingCounts}
      />

      <WabbStats
        totalRecords={0}
        rankedByUser={0}
        currentWindow={collection.current_window as number | null}
        windowDuration={collection.window_duration as string | null}
      />
    </div>
  )
}

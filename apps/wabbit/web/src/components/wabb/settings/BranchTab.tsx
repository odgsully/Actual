import { useState } from 'react'
import { BranchingMenu } from '@/components/wabb/BranchingMenu'
import { branchCollection } from '@/lib/api/collections'
import type { Database } from '@/types/database'
import type { BranchCarryOver } from '@/types/app'

type Collection = Database['public']['Tables']['collections']['Row']

interface Props {
  collection: Collection
}

export function BranchTab({ collection }: Props) {
  const parentId = collection.parent_collection_id as string | null
  const isRoot = !parentId
  const [showMenu, setShowMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBranch(carryOver: BranchCarryOver) {
    setError(null)
    const { data, error: err } = await branchCollection(collection.id, carryOver)

    if (err) {
      setError(typeof err === 'string' ? err : err.message)
      return
    }

    if (data) {
      window.location.href = `/wabb/${data.id}`
    }
  }

  if (showMenu) {
    return (
      <BranchingMenu
        parentTitle={collection.title}
        onBranch={handleBranch}
        onCancel={() => setShowMenu(false)}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Branch Status</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isRoot ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isRoot ? 'Root Wabb' : 'Branch'}
          </span>
        </div>

        {parentId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Parent</span>
            <span className="text-sm text-white/40 font-mono">{parentId.slice(0, 8)}...</span>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={() => setShowMenu(true)}
        className="glass-button w-full"
      >
        Create Branch
      </button>

      <p className="text-xs text-white/30">
        Branching creates a copy with fresh rankings. You can carry over assets, team, and settings.
      </p>
    </div>
  )
}

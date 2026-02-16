interface Collaborator {
  user_id: string
  role: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  collaborators: Collaborator[]
  weights: Record<string, number>
  onChange: (weights: Record<string, number>) => void
}

export function RAVGConfig({ collaborators, weights, onChange }: Props) {
  // Only show weight sliders for rankers (owner + contributor), not viewers
  const rankers = collaborators.filter((c) => c.role !== 'viewer')

  function updateWeight(userId: string, weight: number) {
    onChange({ ...weights, [userId]: weight })
  }

  if (rankers.length === 0) {
    return (
      <div className="glass-card p-4">
        <p className="text-white/30 text-sm">
          Add collaborators to configure custom weights.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 glass-card p-4">
      <p className="text-xs text-white/40 uppercase tracking-wider">
        Per-Member Weights
      </p>
      {rankers.map((c) => {
        const name = c.profiles?.display_name ?? c.user_id.slice(0, 8)
        const weight = weights[c.user_id] ?? 1.0

        return (
          <div key={c.user_id} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80">{name}</span>
                <span className="text-[10px] text-white/30">{c.role}</span>
              </div>
              <span className="text-xs text-white/40 tabular-nums w-10 text-right">
                {weight.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={weight}
              onChange={(e) => updateWeight(c.user_id, parseFloat(e.target.value))}
              className="w-full accent-white/60"
            />
          </div>
        )
      })}
    </div>
  )
}

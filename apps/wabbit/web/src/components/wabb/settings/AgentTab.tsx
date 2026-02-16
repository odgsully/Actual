import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { updateCollection } from '@/lib/api/collections'
import type { AgentOptimizationLevel } from '@/types/app'
import type { Database } from '@/types/database'

type Collection = Database['public']['Tables']['collections']['Row']

interface Props {
  collection: Collection
  onUpdate: (fields: Partial<Collection>) => void
}

const LEVELS: { value: AgentOptimizationLevel; label: string; description: string }[] = [
  {
    value: 'none',
    label: 'None',
    description: 'No agent optimization. Manual-only workflow.',
  },
  {
    value: 'low',
    label: 'Low',
    description: 'Minimal suggestions. Agent observes but rarely intervenes.',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Balanced optimization. Agent suggests improvements and patterns.',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Maximum optimization. Agent actively refines generation parameters.',
  },
]

export function AgentTab({ collection, onUpdate }: Props) {
  const [level, setLevel] = useState<AgentOptimizationLevel>(
    (collection.agent_optimization_level as AgentOptimizationLevel) ?? 'none'
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    const { error: err } = await updateCollection(collection.id, {
      agent_optimization_level: level,
    })

    if (err) {
      setError(err.message)
    } else {
      onUpdate({ agent_optimization_level: level } as Partial<Collection>)
    }
    setSaving(false)
  }

  const hasChanged = level !== ((collection.agent_optimization_level as string) ?? 'none')

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/60">
        Control how much the agent layer optimizes content generation based on ranking data.
      </p>

      <div className="space-y-2">
        {LEVELS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLevel(opt.value)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-700 ${
              level === opt.value
                ? 'bg-white/15 border-white/30'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">{opt.label}</span>
              {opt.value === 'medium' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-white/40">{opt.description}</p>
          </button>
        ))}
      </div>

      <div className="pt-2 border-t border-white/10">
        <p className="text-xs text-white/30 mb-3">
          Agent logic will be connected in Wave 5. This setting is saved for future use.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        variant="primary"
        onClick={handleSave}
        disabled={saving || !hasChanged}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Save Agent Settings'}
      </Button>
    </div>
  )
}

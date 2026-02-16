import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { BranchCarryOver } from '@/types/app'

interface Props {
  parentTitle: string
  onBranch: (carryOver: BranchCarryOver) => Promise<void>
  onCancel: () => void
}

const SMART_DEFAULTS: BranchCarryOver = {
  asset_library: true,
  display_features: true,
  team: false,
  context_docs: false,
  agent_optimization: false,
  notification_preferences: false,
}

const CARRY_OVER_ITEMS: Array<{
  key: keyof BranchCarryOver
  label: string
  description: string
}> = [
  {
    key: 'asset_library',
    label: 'Asset Library',
    description: 'Copy uploaded files from Supabase Storage',
  },
  {
    key: 'display_features',
    label: 'Display Features',
    description: 'Ranking mode, output type, visual config',
  },
  {
    key: 'team',
    label: 'Team',
    description: 'Collaborator assignments and roles',
  },
  {
    key: 'context_docs',
    label: 'Context Docs / SOPs',
    description: 'Project documentation references',
  },
  {
    key: 'agent_optimization',
    label: 'Agent Optimization Level',
    description: 'Agent autonomy setting',
  },
  {
    key: 'notification_preferences',
    label: 'Notification Preferences',
    description: 'Per-user notification config',
  },
]

export function BranchingMenu({ parentTitle, onBranch, onCancel }: Props) {
  const [carryOver, setCarryOver] = useState<BranchCarryOver>({ ...SMART_DEFAULTS })
  const [branching, setBranching] = useState(false)

  function toggle(key: keyof BranchCarryOver) {
    setCarryOver((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleBranch() {
    setBranching(true)
    await onBranch(carryOver)
    setBranching(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-medium">Create Branch</h3>
        <p className="text-sm text-white/60 mt-1">
          Branching <span className="text-white/80">{parentTitle}</span>
        </p>
      </div>

      <div className="glass-card p-4 space-y-1">
        <p className="text-[10px] text-orange-400 uppercase tracking-wider font-medium">
          Rankings never carry over
        </p>
        <p className="text-xs text-white/40">
          Branches always start with fresh rankings. Choose what else to carry over:
        </p>
      </div>

      <div className="space-y-2">
        {CARRY_OVER_ITEMS.map(({ key, label, description }) => (
          <label
            key={key}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 cursor-pointer
              hover:bg-white/8 transition-colors duration-700"
          >
            <input
              type="checkbox"
              checked={carryOver[key]}
              onChange={() => toggle(key)}
              className="mt-0.5 w-4 h-4 accent-white/60 flex-shrink-0"
            />
            <div>
              <span className="text-sm text-white/80 block">{label}</span>
              <span className="text-xs text-white/40">{description}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={branching}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleBranch}
          disabled={branching}
          className="flex-1"
        >
          {branching ? 'Creating Branch...' : 'Create Branch'}
        </Button>
      </div>
    </div>
  )
}

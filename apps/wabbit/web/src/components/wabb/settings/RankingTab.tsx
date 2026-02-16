import { useState, useRef } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { RAVGConfig } from '@/components/wabb/settings/RAVGConfig'
import { updateCollection, branchCollection } from '@/lib/api/collections'
import type { Database } from '@/types/database'
import type { QuaternaryLabels, BranchCarryOver } from '@/types/app'

type Collection = Database['public']['Tables']['collections']['Row']

interface Collaborator {
  user_id: string
  role: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  collection: Collection
  collaborators: Collaborator[]
  onUpdate: (fields: Partial<Collection>) => void
}

const RANKING_MODES = [
  { value: 'one_axis', label: '1-Axis (0–10 slider)' },
  { value: 'binary', label: 'Binary (Yes / No)' },
  { value: 'quaternary', label: 'Quaternary (A/B/C/D)' },
  { value: 'two_axis', label: '2-Axis Grid' },
]

const RAVG_FORMULAS = [
  { value: 'simple_mean', label: 'Simple Mean' },
  { value: 'weighted_by_role', label: 'Weighted by Role' },
  { value: 'exclude_outliers', label: 'Exclude Outliers' },
  { value: 'custom', label: 'Custom' },
]

const DEFAULT_LABELS: QuaternaryLabels = { a: 'A', b: 'B', c: 'C', d: 'D' }

const BRANCH_SMART_DEFAULTS: BranchCarryOver = {
  asset_library: true,
  display_features: true,
  team: false,
  context_docs: false,
  agent_optimization: false,
  notification_preferences: false,
}

export function RankingTab({ collection, collaborators, onUpdate }: Props) {
  const [rankingMode, setRankingMode] = useState<string>(collection.ranking_mode)
  const [ravgFormula, setRavgFormula] = useState(
    (collection.ravg_formula as string) ?? 'simple_mean'
  )
  const [supervisorWeight, setSupervisorWeight] = useState(
    String((collection.supervisor_weight as number) ?? 1.0)
  )
  const [memberWeights, setMemberWeights] = useState<Record<string, number>>(
    (collection.ravg_member_weights as Record<string, number>) ?? {}
  )

  // Quaternary labels
  const originalLabels = useRef<QuaternaryLabels>(
    (collection.quaternary_labels as QuaternaryLabels) ?? DEFAULT_LABELS
  )
  const [quaternaryLabels, setQuaternaryLabels] = useState<QuaternaryLabels>(
    (collection.quaternary_labels as QuaternaryLabels) ?? DEFAULT_LABELS
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBranchConfirm, setShowBranchConfirm] = useState(false)

  const labelsChanged =
    rankingMode === 'quaternary' &&
    JSON.stringify(quaternaryLabels) !== JSON.stringify(originalLabels.current)

  async function handleSave() {
    // If quaternary labels changed, trigger branch confirmation
    if (labelsChanged) {
      setShowBranchConfirm(true)
      return
    }

    await doSave()
  }

  async function doSave() {
    setSaving(true)
    setError(null)

    const fields: Record<string, unknown> = {
      ranking_mode: rankingMode,
      ravg_formula: ravgFormula,
      supervisor_weight: parseFloat(supervisorWeight) || 1.0,
      ravg_member_weights: ravgFormula === 'custom' ? memberWeights : {},
    }

    if (rankingMode === 'quaternary') {
      fields.quaternary_labels = quaternaryLabels
    }

    const { error: err } = await updateCollection(collection.id, fields)
    if (err) {
      setError(err.message)
    } else {
      originalLabels.current = { ...quaternaryLabels }
      onUpdate(fields as unknown as Partial<Collection>)
    }
    setSaving(false)
  }

  async function handleBranchAndSave() {
    setSaving(true)
    setShowBranchConfirm(false)

    // Branch with smart defaults, then apply new labels to branch
    const { data: newCollection, error: branchErr } = await branchCollection(
      collection.id,
      BRANCH_SMART_DEFAULTS
    )

    if (branchErr) {
      setError(typeof branchErr === 'string' ? branchErr : branchErr.message)
      setSaving(false)
      return
    }

    // Apply the new labels to the branched collection
    if (newCollection) {
      await updateCollection(newCollection.id, {
        quaternary_labels: quaternaryLabels,
      })
      // Navigate to the new branch
      window.location.href = `/wabb/${newCollection.id}`
    }

    setSaving(false)
  }

  function handleCancelBranch() {
    setShowBranchConfirm(false)
    // Revert labels
    setQuaternaryLabels({ ...originalLabels.current })
  }

  return (
    <div className="space-y-5">
      <Select
        label="Ranking Mode"
        value={rankingMode}
        onChange={(e) => setRankingMode(e.target.value)}
        options={RANKING_MODES}
      />

      {/* Quaternary label editor */}
      {rankingMode === 'quaternary' && (
        <div className="space-y-2">
          <label className="block text-sm text-white/60">Quaternary Labels</label>
          <div className="grid grid-cols-2 gap-2">
            {(['a', 'b', 'c', 'd'] as const).map((key) => (
              <Input
                key={key}
                value={quaternaryLabels[key]}
                onChange={(e) =>
                  setQuaternaryLabels((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={`Label ${key.toUpperCase()}`}
              />
            ))}
          </div>
          {labelsChanged && (
            <p className="text-xs text-orange-400">
              Changing labels will create a branch with fresh rankings.
            </p>
          )}
        </div>
      )}

      <Select
        label="RAVG Formula"
        value={ravgFormula}
        onChange={(e) => setRavgFormula(e.target.value)}
        options={RAVG_FORMULAS}
      />

      {/* Custom per-member weights */}
      {ravgFormula === 'custom' && (
        <RAVGConfig
          collaborators={collaborators}
          weights={memberWeights}
          onChange={setMemberWeights}
        />
      )}

      <div>
        <label className="block text-sm text-white/60 mb-1">
          Supervisor Weight (Super RAVG)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={supervisorWeight}
            onChange={(e) => setSupervisorWeight(e.target.value)}
            className="flex-1 accent-white/60"
          />
          <span className="text-sm text-white/60 tabular-nums w-10 text-right">
            {parseFloat(supervisorWeight).toFixed(1)}x
          </span>
        </div>
        <p className="text-xs text-white/30 mt-1">
          Owner's score is applied on top of team RAVG at this multiplier.
          {parseFloat(supervisorWeight) === 1.0 && ' (inactive — owner included in team RAVG)'}
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button variant="primary" onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Ranking Settings'}
      </Button>

      {/* Branch confirmation modal for quaternary label changes */}
      {showBranchConfirm && (
        <Modal onClose={handleCancelBranch}>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Label Change Detected</h3>
            <p className="text-sm text-white/60">
              Changing Quaternary labels will create a <strong>Branch</strong> with fresh
              rankings and the new labels. The original Wabb will be preserved.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCancelBranch} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleBranchAndSave} className="flex-1">
                Branch & Apply
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

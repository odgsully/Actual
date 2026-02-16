import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { updateCollection } from '@/lib/api/collections'
import type { Database } from '@/types/database'

type Collection = Database['public']['Tables']['collections']['Row']

interface Props {
  collection: Collection
  onUpdate: (fields: Partial<Collection>) => void
}

export function WindowTab({ collection, onUpdate }: Props) {
  const currentWindow = (collection.current_window as number) ?? 1
  const windowDuration = (collection.window_duration as string) ?? null
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleNewWindow() {
    setSaving(true)
    setError(null)

    const nextWindow = currentWindow + 1
    const { error: err } = await updateCollection(collection.id, {
      current_window: nextWindow,
    })

    if (err) {
      setError(err.message)
    } else {
      onUpdate({ current_window: nextWindow } as Partial<Collection>)
    }
    setSaving(false)
  }

  if (!windowDuration) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-6 text-center">
          <p className="text-white/40 text-sm">
            Windowing is disabled for this Wabb.
          </p>
          <p className="text-white/30 text-xs mt-2">
            Set a window duration when creating the Wabb to enable sprint-based ranking periods.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Current Window</span>
          <span className="text-2xl font-bold tabular-nums">#{currentWindow}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Duration</span>
          <span className="text-sm text-white/80">{windowDuration}</span>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        variant="primary"
        onClick={handleNewWindow}
        disabled={saving}
        className="w-full"
      >
        {saving ? 'Starting...' : 'Close Window & Start New'}
      </Button>

      <p className="text-xs text-white/30">
        Closing a window locks all current rankings and starts a fresh ranking period.
      </p>
    </div>
  )
}

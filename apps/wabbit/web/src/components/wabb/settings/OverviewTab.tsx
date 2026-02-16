import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { updateCollection } from '@/lib/api/collections'
import type { Database } from '@/types/database'

type Collection = Database['public']['Tables']['collections']['Row']

interface Props {
  collection: Collection
  onUpdate: (fields: Partial<Collection>) => void
}

const OUTPUT_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'text', label: 'Text' },
  { value: '3d', label: '3D' },
  { value: 'audio', label: 'Audio' },
  { value: 'deck', label: 'Deck' },
]

const WAB_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'vetted_ref', label: 'Vetted Reference' },
]

export function OverviewTab({ collection, onUpdate }: Props) {
  const [title, setTitle] = useState(collection.title)
  const [description, setDescription] = useState(collection.description ?? '')
  const [outputType, setOutputType] = useState<string>(collection.output_type)
  const [wabType, setWabType] = useState<string>(collection.wab_type)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    const fields = {
      title,
      description: description || null,
      output_type: outputType,
      wab_type: wabType,
    }

    const { error: err } = await updateCollection(collection.id, fields)
    if (err) {
      setError(err.message)
    } else {
      onUpdate(fields as unknown as Partial<Collection>)
    }
    setSaving(false)
  }

  const hasChanges =
    title !== collection.title ||
    description !== (collection.description ?? '') ||
    outputType !== collection.output_type ||
    wabType !== collection.wab_type

  return (
    <div className="space-y-5">
      <Input
        label="Name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Wabb name"
      />

      <div>
        <label className="block text-sm text-white/60 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass-input w-full h-20 resize-none"
          placeholder="Optional description..."
        />
      </div>

      <Select
        label="Content Type"
        value={outputType}
        onChange={(e) => setOutputType(e.target.value)}
        options={OUTPUT_OPTIONS}
      />

      <Select
        label="Wabb Type"
        value={wabType}
        onChange={(e) => setWabType(e.target.value)}
        options={WAB_TYPE_OPTIONS}
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        variant="primary"
        onClick={handleSave}
        disabled={saving || !hasChanges || !title.trim()}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}

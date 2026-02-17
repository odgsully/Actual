import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newWabbSchema, type NewWabbFormData } from '@/schemas/newWabb'
import { createCollection } from '@/lib/api/collections'
import { useState } from 'react'

interface Props {
  folderId?: string | null
  onClose: () => void
  onCreated: (id: string) => void
}

const OUTPUT_TYPES = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'text', label: 'Text' },
  { value: '3d', label: '3D' },
  { value: 'audio', label: 'Audio' },
  { value: 'deck', label: 'Deck' },
] as const

const RANKING_MODES = [
  { value: 'one_axis', label: '1-Axis (0-10)' },
  { value: 'binary', label: 'Binary (Yes/No)' },
  { value: 'quaternary', label: 'Quaternary (A/B/C/D)' },
  { value: 'two_axis', label: '2-Axis Grid' },
] as const

export function NewWabbForm({ folderId, onClose, onCreated }: Props) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewWabbFormData>({
    resolver: zodResolver(newWabbSchema),
    defaultValues: {
      folderId: folderId ?? null,
      outputType: 'image',
      wabType: 'standard',
      rankingMode: 'one_axis',
      agentLevel: 'none',
      ravgFormula: 'simple_mean',
      collaboration: 'solo',
    },
  })

  const rankingMode = watch('rankingMode')
  const outputType = watch('outputType')
  const collaboration = watch('collaboration')

  async function onSubmit(data: NewWabbFormData) {
    setError(null)
    const result = await createCollection(data)
    if (result.error) {
      setError(result.error.message)
      return
    }
    if (result.data) {
      onCreated(result.data.id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative glass-card p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">New Wabb</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Name</label>
            <input
              {...register('title')}
              className="glass-input w-full"
              placeholder="My Wabb"
              autoFocus
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              className="glass-input w-full h-20 resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Output Type */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {OUTPUT_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center gap-2 justify-center cursor-pointer text-sm border rounded-xl px-4 py-2 transition-all duration-700 hover:scale-[1.02] ${
                    outputType === t.value
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    value={t.value}
                    {...register('outputType')}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* Ranking Mode */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Ranking Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RANKING_MODES.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-2 justify-center cursor-pointer text-sm border rounded-xl px-4 py-2 transition-all duration-700 hover:scale-[1.02] ${
                    rankingMode === m.value
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    value={m.value}
                    {...register('rankingMode')}
                    className="sr-only"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          {/* Quaternary Labels — only when quaternary mode */}
          {rankingMode === 'quaternary' && (
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Choice Labels
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['a', 'b', 'c', 'd'] as const).map((key) => (
                  <input
                    key={key}
                    {...register(`quaternaryLabels.${key}`)}
                    className="glass-input text-center text-sm"
                    placeholder={key.toUpperCase()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Collaboration */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`text-center cursor-pointer text-sm border rounded-xl px-4 py-2 transition-all duration-700 hover:scale-[1.02] ${
                collaboration === 'solo'
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}>
                <input
                  type="radio"
                  value="solo"
                  {...register('collaboration')}
                  className="sr-only"
                />
                Solo
              </label>
              <label className={`text-center cursor-pointer text-sm border rounded-xl px-4 py-2 transition-all duration-700 hover:scale-[1.02] ${
                collaboration === 'team'
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}>
                <input
                  type="radio"
                  value="team"
                  {...register('collaboration')}
                  className="sr-only"
                />
                Team
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="glass-button flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl px-4 py-2 transition-all duration-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Wabb'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { textRecordSchema, type TextRecordFormData } from '@/schemas/recordUpload'
import { createRecord } from '@/lib/api/records'

interface Props {
  collectionId: string
  currentWindow: number
  onCreated: () => void
}

export function RecordForm({ collectionId, currentWindow, onCreated }: Props) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TextRecordFormData>({
    resolver: zodResolver(textRecordSchema),
  })

  async function onSubmit(data: TextRecordFormData) {
    setError(null)

    const result = await createRecord({
      collectionId,
      title: data.title,
      description: data.description,
      metadata: { text: data.body },
      windowNumber: currentWindow,
    })

    if (result.error) {
      setError(result.error.message)
      return
    }

    reset()
    onCreated()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm text-white/60 mb-1">Title</label>
        <input
          {...register('title')}
          className="glass-input w-full"
          placeholder="Record title"
          autoFocus
        />
        {errors.title && (
          <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-white/60 mb-1">Description</label>
        <input
          {...register('description')}
          className="glass-input w-full"
          placeholder="Optional..."
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm text-white/60 mb-1">Content</label>
        <textarea
          {...register('body')}
          className="glass-input w-full h-40 resize-none"
          placeholder="Enter text content..."
        />
        {errors.body && (
          <p className="text-red-400 text-xs mt-1">{errors.body.message}</p>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl px-4 py-2 transition-all duration-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Record'}
      </button>
    </form>
  )
}

import { useState, useRef, useCallback } from 'react'
import { bulkCreateRecords } from '@/lib/api/records'
import { validateFileType, validateFileSize } from '@/schemas/recordUpload'
import { ACCEPT_STRING, MAX_FILE_SIZE } from '@/types/app'
import type { OutputType } from '@/types/app'

interface Props {
  collectionId: string
  outputType: OutputType
  currentWindow: number
  onUploaded: () => void
}

interface QueueItem {
  file: File
  title: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export function BulkUploader({ collectionId, outputType, currentWindow, onUploaded }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setValidationError(null)
      const newItems: QueueItem[] = []
      const errors: string[] = []

      for (const file of Array.from(files)) {
        if (!validateFileType(file, outputType)) {
          errors.push(`${file.name}: invalid file type`)
          continue
        }
        if (!validateFileSize(file)) {
          errors.push(`${file.name}: exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
          continue
        }
        newItems.push({
          file,
          title: file.name.replace(/\.[^.]+$/, ''),
          status: 'pending',
        })
      }

      if (errors.length > 0) {
        setValidationError(errors.join('; '))
      }

      setQueue((prev) => [...prev, ...newItems])
    },
    [outputType]
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
  }

  function removeItem(index: number) {
    setQueue((prev) => prev.filter((_, i) => i !== index))
  }

  function clearAll() {
    setQueue([])
    setValidationError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function uploadAll() {
    if (queue.length === 0) return
    setUploading(true)

    const pendingItems = queue.filter((q) => q.status === 'pending')
    const items = pendingItems.map((q) => ({
      collectionId,
      title: q.title,
      file: q.file,
      windowNumber: currentWindow,
    }))

    // Mark all as uploading
    setQueue((prev) =>
      prev.map((q) =>
        q.status === 'pending' ? { ...q, status: 'uploading' as const } : q
      )
    )

    const results = await bulkCreateRecords(items)

    // Update statuses based on results
    setQueue((prev) => {
      let resultIdx = 0
      return prev.map((q) => {
        if (q.status !== 'uploading') return q
        const result = results[resultIdx++]
        if (result?.error) {
          return { ...q, status: 'error' as const, error: result.error }
        }
        return { ...q, status: 'done' as const }
      })
    })

    setUploading(false)
    onUploaded()
  }

  const pendingCount = queue.filter((q) => q.status === 'pending').length
  const doneCount = queue.filter((q) => q.status === 'done').length
  const errorCount = queue.filter((q) => q.status === 'error').length

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center cursor-pointer transition-all duration-700 hover:border-white/30 hover:bg-white/10 bg-white/5"
      >
        <div className="text-white/40 text-sm">
          <p className="text-lg mb-1">Drop files here</p>
          <p>or click to browse (multiple)</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING[outputType]}
          onChange={handleFileInput}
          multiple
          className="hidden"
        />
      </div>

      {validationError && (
        <p className="text-red-400 text-xs">{validationError}</p>
      )}

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>{queue.length} file{queue.length !== 1 ? 's' : ''} queued</span>
            {doneCount > 0 && (
              <span className="text-green-400">
                {doneCount} of {queue.length} uploaded
              </span>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {queue.map((item, idx) => (
              <div
                key={`${item.file.name}-${idx}`}
                className="flex items-center justify-between glass-card px-3 py-2 rounded-xl"
              >
                <div className="flex-1 truncate text-sm">
                  <span className="text-white/80">{item.file.name}</span>
                  <span className="text-white/40 ml-2">
                    ({(item.file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  {item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-white/30 hover:text-white/60 text-xs transition-colors duration-700"
                    >
                      Remove
                    </button>
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-white/40 text-xs">Uploading...</span>
                  )}
                  {item.status === 'done' && (
                    <span className="text-green-400 text-xs">Done</span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-400 text-xs" title={item.error}>
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {errorCount > 0 && (
            <p className="text-red-400 text-xs">
              {errorCount} file{errorCount !== 1 ? 's' : ''} failed to upload
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearAll}
              className="glass-button flex-1"
              disabled={uploading}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={uploadAll}
              disabled={uploading || pendingCount === 0}
              className="flex-1 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl px-4 py-2 transition-all duration-700 disabled:opacity-50"
            >
              {uploading
                ? 'Uploading...'
                : `Upload ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

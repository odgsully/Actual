import { useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recordUploadSchema, type RecordUploadFormData, validateFileType, validateFileSize } from '@/schemas/recordUpload'
import { createRecordWithAsset } from '@/lib/api/records'
import { ACCEPT_STRING, MAX_FILE_SIZE } from '@/types/app'
import type { OutputType } from '@/types/app'

interface Props {
  collectionId: string
  outputType: OutputType
  currentWindow: number
  onUploaded: () => void
}

export function RecordUploader({ collectionId, outputType, currentWindow, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RecordUploadFormData>({
    resolver: zodResolver(recordUploadSchema),
  })

  const handleFile = useCallback(
    (f: File) => {
      setError(null)

      if (!validateFileType(f, outputType)) {
        setError(`Invalid file type. Accepted: ${ACCEPT_STRING[outputType]}`)
        return
      }

      if (!validateFileSize(f)) {
        setError(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
        return
      }

      setFile(f)

      // Auto-fill title from filename (strip extension)
      const name = f.name.replace(/\.[^.]+$/, '')
      setValue('title', name)

      // Generate preview for images and videos
      if (outputType === 'image') {
        const url = URL.createObjectURL(f)
        setPreview(url)
      } else if (outputType === 'video') {
        const url = URL.createObjectURL(f)
        setPreview(url)
      } else {
        setPreview(null)
      }
    },
    [outputType, setValue]
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
  }

  async function onSubmit(data: RecordUploadFormData) {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)

    const result = await createRecordWithAsset({
      collectionId,
      title: data.title,
      description: data.description,
      file,
      windowNumber: currentWindow,
    })

    setUploading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    // Reset form
    setFile(null)
    setPreview(null)
    reset()
    if (inputRef.current) inputRef.current.value = ''
    onUploaded()
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-700 ${
            dragOver
              ? 'border-white/50 bg-white/10'
              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
          }`}
        >
          <div className="text-white/40 text-sm">
            <p className="text-lg mb-1">Drop file here</p>
            <p>or click to browse</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_STRING[outputType]}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="glass-card p-4 space-y-3">
          {/* Preview */}
          {preview && outputType === 'image' && (
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-contain rounded-xl"
            />
          )}
          {preview && outputType === 'video' && (
            <video
              src={preview}
              className="w-full max-h-48 rounded-xl"
              controls
              muted
            />
          )}

          {/* File info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60 truncate flex-1">
              {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-white/40 hover:text-white/80 text-sm ml-2 transition-colors duration-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm text-white/60 mb-1">Title</label>
        <input
          {...register('title')}
          className="glass-input w-full"
          placeholder="Record title"
        />
        {errors.title && (
          <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-white/60 mb-1">Description</label>
        <textarea
          {...register('description')}
          className="glass-input w-full h-16 resize-none"
          placeholder="Optional..."
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl px-4 py-2 transition-all duration-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Record'}
      </button>
    </form>
  )
}

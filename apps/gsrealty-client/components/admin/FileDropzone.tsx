'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { FILE_CONSTRAINTS, formatFileSize, validateFile } from '@/lib/validation/upload-schema'

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  disabled?: boolean
  error?: string
}

export function FileDropzone({
  onFileSelect,
  selectedFile,
  disabled = false,
  error,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        const validation = validateFile(file)

        if (validation.valid) {
          onFileSelect(file)
        } else {
          onFileSelect(null)
        }
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: FILE_CONSTRAINTS.MAX_SIZE,
    multiple: false,
    disabled,
  })

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelect(null)
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? 'border-brand-red bg-red-50 scale-[1.02]'
              : isDragReject || error
              ? 'border-red-400 bg-red-50'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-brand-red hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          // File selected state
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">File Selected</h3>
              <div className="inline-flex items-center space-x-3 px-4 py-3 bg-white border border-gray-200 rounded-lg">
                <File className="w-5 h-5 text-gray-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Click or drag to replace this file
            </p>
          </div>
        ) : isDragActive ? (
          // Dragging state
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Upload className="w-12 h-12 text-brand-red animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Drop your file here</h3>
              <p className="text-sm text-gray-600">Release to upload</p>
            </div>
          </div>
        ) : isDragReject || error ? (
          // Error state
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-900">Invalid File</h3>
              <p className="text-sm text-red-600">
                {error || 'Please upload a valid CSV or Excel file under 10MB'}
              </p>
            </div>
          </div>
        ) : (
          // Default state
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Upload className="w-12 h-12 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Drop your file here, or click to browse
              </h3>
              <p className="text-sm text-gray-600">
                CSV or Excel files only, up to 10MB
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">CSV</span>
              <span className="px-2 py-1 bg-gray-100 rounded">XLSX</span>
              <span className="px-2 py-1 bg-gray-100 rounded">XLS</span>
            </div>
          </div>
        )}
      </div>

      {error && !isDragReject && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

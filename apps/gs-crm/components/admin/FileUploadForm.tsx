'use client'

import { useState, useEffect } from 'react'
import { FileDropzone } from './FileDropzone'
import { UploadProgress } from './UploadProgress'
import { ProcessingResults } from './ProcessingResults'
import {
  uploadFormSchema,
  UPLOAD_TYPES,
  PROCESSING_STATUS,
  getUploadTypeLabel,
  type UploadFormData,
  type UploadResult,
  type ProcessingStatus,
} from '@/lib/validation/upload-schema'
import { getAllClients, type GSRealtyClient } from '@/lib/database/clients'
import { Upload, User } from 'lucide-react'

interface FileUploadFormProps {
  onUploadComplete?: (result: UploadResult) => void
}

export function FileUploadForm({ onUploadComplete }: FileUploadFormProps) {
  // Form state
  const [clients, setClients] = useState<GSRealtyClient[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [uploadType, setUploadType] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Processing state
  const [status, setStatus] = useState<ProcessingStatus>(PROCESSING_STATUS.IDLE)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string>()
  const [result, setResult] = useState<UploadResult | null>(null)

  // Validation state
  const [errors, setErrors] = useState<{
    clientId?: string
    uploadType?: string
    file?: string
  }>({})

  // Load clients on mount
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoadingClients(true)
    const { clients: data, error } = await getAllClients()
    if (error) {
      console.error('Error loading clients:', error)
    } else {
      setClients(data || [])
    }
    setLoadingClients(false)
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!selectedClientId) {
      newErrors.clientId = 'Please select a client'
    }

    if (!uploadType) {
      newErrors.uploadType = 'Please select an upload type'
    }

    if (!selectedFile) {
      newErrors.file = 'Please select a file to upload'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    // Validate with Zod schema
    try {
      const formData: UploadFormData = {
        clientId: selectedClientId,
        uploadType: uploadType as any,
        file: selectedFile!,
      }

      uploadFormSchema.parse(formData)

      // Start upload process
      await processUpload(formData)
    } catch (error: any) {
      if (error.errors) {
        const zodErrors: typeof errors = {}
        error.errors.forEach((err: any) => {
          const field = err.path[0]
          zodErrors[field as keyof typeof errors] = err.message
        })
        setErrors(zodErrors)
      }
    }
  }

  const processUpload = async (formData: UploadFormData) => {
    try {
      // Start uploading
      setStatus(PROCESSING_STATUS.UPLOADING)
      setProgress(0)
      setMessage('Uploading file to server...')

      // Create FormData for upload
      const uploadData = new FormData()
      uploadData.append('clientId', formData.clientId)
      uploadData.append('uploadType', formData.uploadType)
      uploadData.append('file', formData.file)

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 40))
      }, 200)

      // Upload file
      const response = await fetch('/api/admin/upload/process', {
        method: 'POST',
        body: uploadData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Start processing
      setStatus(PROCESSING_STATUS.PROCESSING)
      setProgress(50)
      setMessage('Processing MLS data...')

      // Simulate progress during processing
      const processingInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 300)

      const uploadResult: UploadResult = await response.json()

      clearInterval(processingInterval)

      // Complete
      setProgress(100)
      setStatus(PROCESSING_STATUS.COMPLETE)
      setMessage('Processing complete!')
      setResult(uploadResult)

      // Notify parent
      if (onUploadComplete) {
        onUploadComplete(uploadResult)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setStatus(PROCESSING_STATUS.ERROR)
      setMessage(error.message || 'An error occurred during upload')
      setResult({
        success: false,
        message: error.message || 'Upload failed',
        errors: [error.message || 'Unknown error occurred'],
      })
    }
  }

  const handleReset = () => {
    setSelectedClientId('')
    setUploadType('')
    setSelectedFile(null)
    setStatus(PROCESSING_STATUS.IDLE)
    setProgress(0)
    setMessage(undefined)
    setResult(null)
    setErrors({})
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  // Show results if processing is complete
  if (status === PROCESSING_STATUS.COMPLETE && result) {
    return (
      <ProcessingResults
        result={result}
        clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined}
        onNewUpload={handleReset}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Select Client <span className="text-red-600">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value)
              setErrors((prev) => ({ ...prev, clientId: undefined }))
            }}
            disabled={loadingClients || status !== PROCESSING_STATUS.IDLE}
            className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
              errors.clientId
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-brand-red'
            } ${loadingClients || status !== PROCESSING_STATUS.IDLE ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            aria-label="Select client"
          >
            <option value="">
              {loadingClients ? 'Loading clients...' : 'Choose a client'}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
                {client.email && ` (${client.email})`}
              </option>
            ))}
          </select>
        </div>
        {errors.clientId && (
          <p className="mt-2 text-sm text-red-600">{errors.clientId}</p>
        )}
      </div>

      {/* Upload Type Selection */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          Upload Type <span className="text-red-600">*</span>
        </label>
        <div className="space-y-3">
          {Object.values(UPLOAD_TYPES).map((type) => (
            <label
              key={type}
              className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                uploadType === type
                  ? 'border-brand-red bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${status !== PROCESSING_STATUS.IDLE ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="uploadType"
                value={type}
                checked={uploadType === type}
                onChange={(e) => {
                  setUploadType(e.target.value)
                  setErrors((prev) => ({ ...prev, uploadType: undefined }))
                }}
                disabled={status !== PROCESSING_STATUS.IDLE}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{getUploadTypeLabel(type)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {type === UPLOAD_TYPES.DIRECT_COMPS &&
                    'Upload direct comparable properties for this client'}
                  {type === UPLOAD_TYPES.ALL_SCOPES &&
                    'Upload all properties within specified scope'}
                  {type === UPLOAD_TYPES.HALF_MILE &&
                    'Upload properties within half mile radius'}
                </p>
              </div>
            </label>
          ))}
        </div>
        {errors.uploadType && (
          <p className="mt-2 text-sm text-red-600">{errors.uploadType}</p>
        )}
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          Upload File <span className="text-red-600">*</span>
        </label>
        <FileDropzone
          onFileSelect={(file) => {
            setSelectedFile(file)
            setErrors((prev) => ({ ...prev, file: undefined }))
          }}
          selectedFile={selectedFile}
          disabled={status !== PROCESSING_STATUS.IDLE}
          error={errors.file}
        />
      </div>

      {/* Progress */}
      {status !== PROCESSING_STATUS.IDLE && status !== PROCESSING_STATUS.COMPLETE && (
        <UploadProgress
          status={status}
          progress={progress}
          message={message}
        />
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-4">
        {status === PROCESSING_STATUS.IDLE && (
          <>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!selectedClientId || !uploadType || !selectedFile}
              className="flex items-center space-x-2 px-6 py-3 bg-brand-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              <span>Upload & Process</span>
            </button>
          </>
        )}
      </div>
    </form>
  )
}

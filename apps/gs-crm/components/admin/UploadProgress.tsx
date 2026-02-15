'use client'

import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { PROCESSING_STATUS, type ProcessingStatus } from '@/lib/validation/upload-schema'

interface UploadProgressProps {
  status: ProcessingStatus
  progress: number // 0-100
  message?: string
  stats?: {
    rowsProcessed?: number
    totalRows?: number
    errorsFound?: number
  }
}

export function UploadProgress({ status, progress, message, stats }: UploadProgressProps) {
  const getStatusColor = () => {
    switch (status) {
      case PROCESSING_STATUS.COMPLETE:
        return 'bg-green-600'
      case PROCESSING_STATUS.ERROR:
        return 'bg-red-600'
      case PROCESSING_STATUS.UPLOADING:
      case PROCESSING_STATUS.PROCESSING:
        return 'bg-brand-red'
      default:
        return 'bg-gray-300'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case PROCESSING_STATUS.COMPLETE:
        return <CheckCircle2 className="w-6 h-6 text-green-600" />
      case PROCESSING_STATUS.ERROR:
        return <AlertCircle className="w-6 h-6 text-red-600" />
      case PROCESSING_STATUS.UPLOADING:
      case PROCESSING_STATUS.PROCESSING:
        return <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case PROCESSING_STATUS.UPLOADING:
        return 'Uploading file...'
      case PROCESSING_STATUS.PROCESSING:
        return 'Processing data...'
      case PROCESSING_STATUS.COMPLETE:
        return 'Processing complete!'
      case PROCESSING_STATUS.ERROR:
        return 'Processing failed'
      default:
        return 'Ready to upload'
    }
  }

  if (status === PROCESSING_STATUS.IDLE) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4">
      {/* Status Header */}
      <div className="flex items-center space-x-4">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{getStatusText()}</h3>
          {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
        </div>
      </div>

      {/* Progress Bar */}
      {(status === PROCESSING_STATUS.UPLOADING || status === PROCESSING_STATUS.PROCESSING) && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{Math.round(progress)}% complete</span>
            {stats?.rowsProcessed !== undefined && stats?.totalRows !== undefined && (
              <span>
                {stats.rowsProcessed} / {stats.totalRows} rows processed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Processing Stats */}
      {stats && (status === PROCESSING_STATUS.PROCESSING || status === PROCESSING_STATUS.COMPLETE) && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {stats.totalRows !== undefined && (
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalRows}</p>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Total Rows</p>
            </div>
          )}
          {stats.rowsProcessed !== undefined && (
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.rowsProcessed}</p>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Processed</p>
            </div>
          )}
          {stats.errorsFound !== undefined && (
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.errorsFound}</p>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Errors</p>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {status === PROCESSING_STATUS.UPLOADING && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Uploading your file to the server. Please do not close this window.
          </p>
        </div>
      )}

      {status === PROCESSING_STATUS.PROCESSING && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Processing your data and populating the template. This may take a few moments.
          </p>
        </div>
      )}

      {status === PROCESSING_STATUS.COMPLETE && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Your file has been processed successfully! You can now view the results below.
          </p>
        </div>
      )}

      {status === PROCESSING_STATUS.ERROR && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            {message || 'An error occurred while processing your file. Please try again.'}
          </p>
        </div>
      )}
    </div>
  )
}

'use client'

import { CheckCircle2, AlertTriangle, XCircle, Download, Eye, Home } from 'lucide-react'
import { type UploadResult } from '@/lib/validation/upload-schema'
import { useRouter } from 'next/navigation'

interface ProcessingResultsProps {
  result: UploadResult
  clientName?: string
  onNewUpload?: () => void
}

export function ProcessingResults({ result, clientName, onNewUpload }: ProcessingResultsProps) {
  const router = useRouter()

  if (!result.success) {
    return (
      <div className="bg-white rounded-lg border-2 border-red-300 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 mb-2">Processing Failed</h3>
            <p className="text-sm text-red-700 mb-4">
              {result.message || 'An error occurred while processing your file.'}
            </p>

            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-red-900 mb-2">Errors:</h4>
                <ul className="space-y-1">
                  {result.errors.map((error: string, index: number) => (
                    <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                      <span className="text-red-500">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={onNewUpload}
                className="px-4 py-2 bg-brand-red text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border-2 border-green-300 p-6">
      <div className="flex items-start space-x-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-green-900 mb-1">Processing Complete!</h3>
          <p className="text-sm text-green-700">
            {result.message || 'Your file has been successfully processed and populated into the template.'}
          </p>
        </div>
      </div>

      {/* Processing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {result.totalRows !== undefined && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">{result.totalRows}</p>
              </div>
              <Home className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        )}

        {result.validRows !== undefined && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Valid Comps</p>
                <p className="text-2xl font-bold text-green-900">{result.validRows}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
        )}

        {result.skippedRows !== undefined && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 mb-1">Skipped</p>
                <p className="text-2xl font-bold text-amber-900">{result.skippedRows}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        )}
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">Warnings:</h4>
              <ul className="space-y-1">
                {result.warnings.map((warning: string, index: number) => (
                  <li key={index} className="text-sm text-amber-800 flex items-start space-x-2">
                    <span className="text-amber-600">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Additional Details */}
      {clientName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Client:</span> {clientName}
          </p>
          {result.uploadId && (
            <p className="text-xs text-blue-700 mt-1">
              Upload ID: {result.uploadId}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
        {result.downloadUrl && (
          <a
            href={result.downloadUrl}
            download
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-brand-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download Processed Template</span>
          </a>
        )}

        <button
          onClick={() => router.push('/admin/clients')}
          className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-brand-black text-brand-black font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-5 h-5" />
          <span>View Client Properties</span>
        </button>

        {onNewUpload && (
          <button
            onClick={onNewUpload}
            className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>Upload Another File</span>
          </button>
        )}
      </div>

      {/* Success Message */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Your file has been processed and is now available for viewing.
          {result.downloadUrl && ' You can download the populated template using the button above.'}
        </p>
      </div>
    </div>
  )
}

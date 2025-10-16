'use client'

import { useState } from 'react'
import { FileUploadForm } from '@/components/admin/FileUploadForm'
import { UploadHistory } from '@/components/admin/UploadHistory'
import { Upload, History, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { type UploadResult } from '@/lib/validation/upload-schema'

export default function UploadPage() {
  const [showHistory, setShowHistory] = useState(false)
  const [lastUpload, setLastUpload] = useState<UploadResult | null>(null)

  const handleUploadComplete = (result: UploadResult) => {
    setLastUpload(result)
    // Could trigger a refresh of the upload history here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Upload Files</h1>
          <p className="text-gray-600 mt-1">
            Upload and process MLS data files for your clients
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center space-x-2 px-4 py-2 border-2 font-medium rounded-lg transition-colors ${
            showHistory
              ? 'bg-brand-black text-white border-brand-black'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <History className="w-5 h-5" />
          <span>{showHistory ? 'Hide' : 'Show'} History</span>
        </button>
      </div>

      {/* Information Banner */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              File Upload Instructions
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload MLS data files in CSV or Excel format (max 10MB)</li>
              <li>• Select the client and upload type before uploading</li>
              <li>• The system will process the data and populate the template automatically</li>
              <li>• You can download the processed template after completion</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload MLS Data</h2>
            <p className="text-sm text-gray-600">
              Process client property data from MLS exports
            </p>
          </div>
        </div>

        <FileUploadForm onUploadComplete={handleUploadComplete} />
      </div>

      {/* Upload History */}
      {showHistory && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload History</h2>
              <p className="text-sm text-gray-600">
                View and manage recent file uploads
              </p>
            </div>
          </div>

          <UploadHistory limit={10} />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Supported Formats</p>
              <p className="text-2xl font-bold text-gray-900">CSV, Excel</p>
            </div>
            <FileSpreadsheet className="w-10 h-10 text-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Max File Size</p>
              <p className="text-2xl font-bold text-gray-900">10 MB</p>
            </div>
            <Upload className="w-10 h-10 text-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">~2 min</p>
            </div>
            <History className="w-10 h-10 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Upload Types</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <strong>Direct Comps:</strong> Properties directly comparable to client property
              </li>
              <li>
                <strong>All Scopes:</strong> All properties within the specified scope
              </li>
              <li>
                <strong>Half Mile:</strong> Properties within a half-mile radius
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">File Requirements</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• CSV or Excel format (.csv, .xlsx, .xls)</li>
              <li>• Maximum file size: 10 MB</li>
              <li>• Must contain valid MLS data fields</li>
              <li>• One file per upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

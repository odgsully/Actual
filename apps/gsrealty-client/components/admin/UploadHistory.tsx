'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { getUploadTypeLabel } from '@/lib/validation/upload-schema'

interface UploadRecord {
  id: string
  clientId: string
  clientName: string
  fileName: string
  uploadType: string
  status: 'complete' | 'processing' | 'failed'
  totalRows?: number
  validRows?: number
  uploadedAt: string
  downloadUrl?: string
}

interface UploadHistoryProps {
  clientFilter?: string
  limit?: number
}

export function UploadHistory({ clientFilter, limit = 20 }: UploadHistoryProps) {
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadUploadHistory()
  }, [clientFilter])

  const loadUploadHistory = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/upload/history?clientId=${clientFilter || ''}`)
      // const data = await response.json()
      // setUploads(data.uploads)

      // Mock data for now
      setUploads([])
    } catch (error) {
      console.error('Error loading upload history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/upload/${id}`, { method: 'DELETE' })
      setUploads((prev) => prev.filter((upload) => upload.id !== id))
    } catch (error) {
      console.error('Error deleting upload:', error)
      alert('Failed to delete upload')
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const getStatusIcon = (status: UploadRecord['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusBadge = (status: UploadRecord['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (uploads.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No upload history</h3>
          <p className="text-gray-500">
            Upload files will appear here once you start processing MLS data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Results
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {uploads.slice(0, limit).map((upload) => (
                <tr key={upload.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm truncate max-w-xs">
                          {upload.fileName}
                        </div>
                        <div className="text-xs text-gray-500">{upload.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{upload.clientName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {getUploadTypeLabel(upload.uploadType as any)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload.status)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          upload.status
                        )}`}
                      >
                        {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {upload.status === 'complete' && upload.validRows !== undefined ? (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-green-600">{upload.validRows}</span> /{' '}
                        {upload.totalRows} valid
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {new Date(upload.uploadedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(upload.uploadedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {upload.downloadUrl && upload.status === 'complete' && (
                        <a
                          href={upload.downloadUrl}
                          download
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </a>
                      )}
                      <button
                        onClick={() => {}}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(upload.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Upload?</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this upload? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Count */}
      {uploads.length > limit && (
        <div className="text-center text-sm text-gray-500">
          Showing {limit} of {uploads.length} uploads
        </div>
      )}
    </div>
  )
}

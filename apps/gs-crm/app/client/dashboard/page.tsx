'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { EventFeed } from '@/components/shared/EventFeed'
import { Download, FileSpreadsheet, AlertCircle } from 'lucide-react'

interface UploadedFile {
  id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  uploaded_at: string
}

interface EventEntry {
  id: string
  title: string
  tags: string[]
  body: string
  created_at: string
  client_id?: string | null
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [events, setEvents] = useState<EventEntry[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)

  useEffect(() => {
    fetchFiles()
    fetchEvents()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/client/files')
      const result = await response.json()
      if (result.success) {
        setFiles(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoadingFiles(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const result = await response.json()
      if (result.success) {
        setEvents(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleDownload = async (file: UploadedFile) => {
    try {
      const response = await fetch(`/api/client/files/${file.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.file_name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border-2 border-brand-black p-6">
        <h1 className="text-3xl font-bold text-brand-black mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600">
          View your property analysis files and stay updated with the latest events.
        </p>
      </div>

      {/* Downloads Section - Only show if files exist */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-brand-red rounded-lg p-3">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Analysis Files</h2>
              <p className="text-sm text-gray-600">
                Download your property analysis reports
              </p>
            </div>
          </div>

          {loadingFiles ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-brand-red transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-white rounded p-2 border border-gray-200">
                      <FileSpreadsheet className="w-6 h-6 text-brand-red" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{file.file_name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span className="text-gray-300">•</span>
                        <span>Uploaded {formatDate(file.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(file)}
                    className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Feed */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-brand-red rounded-lg p-3">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Updates & Events</h2>
            <p className="text-sm text-gray-600">
              Stay informed about property viewings, open houses, and other activities
            </p>
          </div>
        </div>

        <EventFeed
          events={events}
          isLoading={loadingEvents}
          emptyMessage="No updates yet. Your agent will post important events here."
        />
      </div>
    </div>
  )
}

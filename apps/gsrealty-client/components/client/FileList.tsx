'use client'

import { FileText, Download, Calendar, HardDrive } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileListProps {
  file: {
    id: string
    file_name: string
    file_type: string
    file_size: number
    upload_date: string
    storage_path: string
    processed: boolean
    processing_status?: string | null
  }
  onDownloadClick?: (fileId: string) => void
}

export function FileList({ file, onDownloadClick }: FileListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return '📄'
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return '🖼️'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('word') || type.includes('document')) return '📝'
    return '📎'
  }

  const handleDownload = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('client-files')
        .download(file.storage_path)

      if (error) {
        console.error('Download error:', error)
        alert('Failed to download file')
        return
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onDownloadClick?.(file.id)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      {/* File Info */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* File Icon */}
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{getFileIcon(file.file_type)}</span>
        </div>

        {/* File Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-brand-black truncate">{file.file_name}</h4>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(file.upload_date)}</span>
            </div>
            <div className="flex items-center">
              <HardDrive className="w-4 h-4 mr-1" />
              <span>{formatFileSize(file.file_size)}</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              <span>{file.file_type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="ml-4 flex items-center space-x-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex-shrink-0"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
      </button>
    </div>
  )
}

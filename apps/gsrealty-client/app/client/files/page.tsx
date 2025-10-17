'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Search, Filter, FileText } from 'lucide-react'
import { FileList } from '@/components/client/FileList'
import { getClientFiles } from '@/lib/database/files'
import type { UploadedFile } from '@/lib/types/storage'

export default function FilesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    async function loadFiles() {
      if (!user?.id) return

      try {
        const { files: clientFiles } = await getClientFiles(user.id)
        setFiles(clientFiles)
        setFilteredFiles(clientFiles)
      } catch (error) {
        console.error('[Files] Error loading files:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [user?.id])

  // Filter files based on search and type
  useEffect(() => {
    let filtered = files

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((f) =>
        f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((f) =>
        f.file_type.toLowerCase().includes(typeFilter.toLowerCase())
      )
    }

    setFilteredFiles(filtered)
  }, [searchQuery, typeFilter, files])

  const uniqueFileTypes = Array.from(
    new Set(files.map((f) => f.file_type).filter(Boolean))
  ).map((type) => {
    // Simplify file types for display
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return 'Image'
    if (type.includes('excel') || type.includes('spreadsheet')) return 'Spreadsheet'
    if (type.includes('word') || type.includes('document')) return 'Document'
    return type
  })

  const uniqueTypes = Array.from(new Set(uniqueFileTypes))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-brand-black mb-2">My Files</h1>
        <p className="text-gray-600">
          Download and manage files shared by your agent
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type.toLowerCase()}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredFiles.length} of {files.length} files
        </div>
      </div>

      {/* Files List */}
      {filteredFiles.length > 0 ? (
        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <FileList
              key={file.id}
              file={file}
              onDownloadClick={(fileId) => {
                console.log('Downloaded file:', fileId)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No files found
          </h3>
          <p className="text-gray-600">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Your files will appear here once your agent uploads them'}
          </p>
        </div>
      )}

      {/* File Stats */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-brand-black mb-4">File Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-red">{files.length}</p>
              <p className="text-sm text-gray-600">Total Files</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {(
                  files.reduce((sum, f) => sum + f.file_size, 0) /
                  1024 /
                  1024
                ).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">MB Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {files.filter((f) => {
                  const uploadDate = new Date(f.upload_date)
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return uploadDate > thirtyDaysAgo
                }).length}
              </p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {uniqueTypes.length}
              </p>
              <p className="text-sm text-gray-600">File Types</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

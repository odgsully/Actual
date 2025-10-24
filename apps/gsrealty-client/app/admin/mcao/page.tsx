'use client'

import { useState } from 'react'
import { Search, Upload, Download, AlertCircle } from 'lucide-react'
import { MCAOCategorizedData } from '../../../components/admin/MCAOCategorizedData'

export default function MCAOLookupPage() {
  const [searchInput, setSearchInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [bulkStatus, setBulkStatus] = useState<any>(null)

  const handleSingleSearch = async () => {
    if (!searchInput.trim()) {
      alert('Please enter an address or APN')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setBulkStatus(null)

    try {
      const input = searchInput.trim()

      // Determine if input is an APN (format XXX-XX-XXX) or an address
      const isAPN = /^\d{3}-\d{2}-\d{3}/.test(input)

      const requestBody = isAPN
        ? { apn: input }
        : { address: input }

      const response = await fetch('/api/admin/mcao/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data) // Store full MCAOLookupResult (includes categorizedData, fieldCount, etc.)
      } else {
        setError(data.error || 'Failed to fetch property data')
      }
    } catch (err: any) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = async () => {
    if (!file) {
      alert('Please select a file')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setBulkStatus(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/mcao/bulk', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setBulkStatus(data)
        // Auto-download if available
        if (data.downloadUrl) {
          window.location.href = data.downloadUrl
        }
      } else {
        setError(data.error || 'Processing failed')
      }
    } catch (err: any) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
      setFile(null)
    }
  }

  const handleDownloadSingle = async () => {
    if (!results?.apn) return

    try {
      const response = await fetch('/api/admin/mcao/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apn: results.apn }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `MCAO-${results.apn}-${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download file')
      }
    } catch (err) {
      alert('Download error')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-black">
          Maricopa County Assessor's Office
        </h1>
        <p className="text-gray-600 mt-2">Property Data API Interface</p>
      </div>

      {/* Single Property Lookup */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-brand-black mb-4">
          Single Property Lookup
        </h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()}
              placeholder="Enter address (e.g., 1234 N Main St, Phoenix, AZ) or APN (123-45-678)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
            <button
              onClick={handleSingleSearch}
              disabled={loading}
              className="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>GO</span>
            </button>
          </div>
          <p className="text-sm text-gray-600">
            💡 <strong>Note:</strong> You can now search by full address only - no APN needed!
            The system will automatically look up the APN using the same logic as the MLS Upload page.
          </p>
        </div>
        {results && (
          <button
            onClick={handleDownloadSingle}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download as Excel</span>
          </button>
        )}
      </div>

      {/* Bulk Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-brand-black mb-4">
          Bulk APN Upload
        </h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-red cursor-pointer transition-colors">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">
                    {file ? file.name : 'Choose Excel or CSV file...'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            <button
              onClick={handleBulkUpload}
              disabled={!file || loading}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process File
            </button>
          </div>
          <p className="text-sm text-gray-500">
            File must contain an "APN" column
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4" />
          <p className="text-gray-600">Processing...</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-brand-black mb-4">
            Property Details
          </h2>

          {/* Show APN lookup info if address was used */}
          {results.lookupMethod && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ✓ Found APN: <strong>{results.apn}</strong> via {results.lookupMethod}
                (confidence: {Math.round((results.lookupConfidence || 0) * 100)}%)
              </p>
            </div>
          )}

          {/* Display categorized data if available */}
          {results.categorizedData ? (
            <MCAOCategorizedData
              categorizedData={results.categorizedData}
              fieldCount={results.fieldCount}
              apn={results.data?.apn || results.apn}
            />
          ) : (
            /* Fallback to basic display if categorized data not available */
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  APN: {results.data?.apn || results.apn}
                </h3>
                <p className="text-sm text-gray-500">
                  {results.data ? Object.keys(results.data).length : 0} fields retrieved
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {results.data && Object.entries(results.data).map(([key, value]: [string, any]) => (
                  <div key={key} className="border rounded-lg p-3">
                    <dt className="text-sm font-medium text-gray-500">{key}</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {value !== null && value !== undefined ? String(value) : 'N/A'}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Status */}
      {bulkStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-brand-black mb-4">
            Bulk Processing Complete
          </h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <p>
              <strong>Total APNs:</strong> {bulkStatus.total}
            </p>
            <p>
              <strong>Successfully Processed:</strong> {bulkStatus.processed}
            </p>
            <p>
              <strong>Errors:</strong> {bulkStatus.errors}
            </p>
            <p className="text-green-700 font-medium">
              File downloaded automatically!
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

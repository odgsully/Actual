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

      if (response.ok) {
        // Handle ZIP file download
        const blob = await response.blob()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `MCAO_Bulk_${timestamp}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Show success message
        setBulkStatus({
          success: true,
          message: 'Processing complete! Your ZIP file has been downloaded.'
        })
      } else {
        // Try to parse error message
        try {
          const data = await response.json()
          setError(data.error || 'Processing failed')
        } catch {
          setError('Processing failed. Please try again.')
        }
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
        <h1 className="text-3xl font-bold text-white">
          Maricopa County Assessor's Office
        </h1>
        <p className="text-white/60 mt-2">Property Data API Interface</p>
      </div>

      {/* Single Property Lookup */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
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
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
            />
            <button
              onClick={handleSingleSearch}
              disabled={loading}
              className="px-6 py-2 bg-brand-red text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>GO</span>
            </button>
          </div>
          <p className="text-sm text-white/60">
            💡 <strong className="text-white/80">Note:</strong> You can now search by full address only - no APN needed!
            The system will automatically look up the APN using the same logic as the MLS Upload page.
          </p>
        </div>
        {results && (
          <button
            onClick={handleDownloadSingle}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download as Excel</span>
          </button>
        )}
      </div>

      {/* Bulk Upload */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Bulk Address → APN → MCAO Lookup
        </h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block w-full px-4 py-2 border-2 border-dashed border-white/30 rounded-xl hover:border-white/50 bg-white/5 cursor-pointer transition-colors">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-white/40" />
                  <span className="text-white/60">
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
              className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Process File
            </button>
          </div>
          <div className="text-sm text-white/60 space-y-1">
            <p>📋 <strong className="text-white/80">Required:</strong> A column with addresses (accepted headers: Address, FULL_ADDRESS, Property Address, etc.)</p>
            <p>📦 <strong className="text-white/80">Output:</strong> ZIP file containing:</p>
            <ul className="ml-5 text-white/50">
              <li>• APN_Grab_*.xlsx - Address to APN mapping</li>
              <li>• MCAO_*.xlsx - Full MCAO data (559+ fields)</li>
              <li>• Your original input file</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4" />
          <p className="text-white/60">Processing...</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Property Details
          </h2>

          {/* Show APN lookup info if address was used */}
          {results.lookupMethod && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
              <p className="text-sm text-blue-300">
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
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-lg font-medium text-white">
                  APN: {results.data?.apn || results.apn}
                </h3>
                <p className="text-sm text-white/50">
                  {results.data ? Object.keys(results.data).length : 0} fields retrieved
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {results.data && Object.entries(results.data).map(([key, value]: [string, any]) => (
                  <div key={key} className="border border-white/10 rounded-xl p-3 bg-white/5">
                    <dt className="text-sm font-medium text-white/50">{key}</dt>
                    <dd className="mt-1 text-sm text-white">
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
      {bulkStatus && bulkStatus.success && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Bulk Processing Complete
          </h2>
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
            <p className="text-green-300 font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {bulkStatus.message || 'Processing complete! Your ZIP file has been downloaded.'}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-300 mb-2">Error</h3>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

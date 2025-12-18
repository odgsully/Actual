'use client'

import { useState } from 'react'
import { Upload, Download, Search, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react'

interface UploadedData {
  fileName: string
  propertiesCount: number
  data: any[]
}

export default function UploadPage() {
  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [subjectAPN, setSubjectAPN] = useState('')
  const [subjectData, setSubjectData] = useState<any>(null)

  // Track each upload type
  const [halfMileComps, setHalfMileComps] = useState<UploadedData | null>(null)
  const [directComps, setDirectComps] = useState<UploadedData | null>(null)
  const [allScopesComps, setAllScopesComps] = useState<UploadedData | null>(null)

  // Loading states
  const [loadingSubject, setLoadingSubject] = useState(false)
  const [loadingHalfMile, setLoadingHalfMile] = useState(false)
  const [loadingDirect, setLoadingDirect] = useState(false)
  const [loadingAllScopes, setLoadingAllScopes] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Errors
  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [halfMileError, setHalfMileError] = useState<string | null>(null)
  const [directError, setDirectError] = useState<string | null>(null)
  const [allScopesError, setAllScopesError] = useState<string | null>(null)

  // Fetch subject property by APN
  const handleFetchSubject = async () => {
    if (!subjectAPN.trim()) {
      setSubjectError('Please enter an APN')
      return
    }

    setLoadingSubject(true)
    setSubjectError(null)

    try {
      const response = await fetch('/api/admin/mcao/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apn: subjectAPN.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        setSubjectData(result.data)
      } else {
        setSubjectError(result.error || 'Failed to fetch property data')
      }
    } catch (error: any) {
      setSubjectError('Network error: ' + error.message)
    } finally {
      setLoadingSubject(false)
    }
  }

  // Upload and process CSV files
  const handleFileUpload = async (
    file: File,
    type: 'halfMile' | 'direct' | 'allScopes'
  ) => {
    const setLoading = type === 'halfMile' ? setLoadingHalfMile : type === 'direct' ? setLoadingDirect : setLoadingAllScopes
    const setError = type === 'halfMile' ? setHalfMileError : type === 'direct' ? setDirectError : setAllScopesError
    const setData = type === 'halfMile' ? setHalfMileComps : type === 'direct' ? setDirectComps : setAllScopesComps

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadType', type === 'halfMile' ? 'half_mile' : type === 'direct' ? 'direct_comps' : 'all_scopes')
      if (clientId) formData.append('clientId', clientId)

      const response = await fetch('/api/admin/upload/process', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setData({
          fileName: file.name,
          propertiesCount: result.data.processedCount,
          data: result.data.properties,
        })
      } else {
        setError(result.error?.message || 'Upload failed')
      }
    } catch (error: any) {
      setError('Network error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Generate final Excel report
  const handleGenerateReport = async () => {
    if (!subjectData) {
      alert('Please fetch subject property data first')
      return
    }
    if (!halfMileComps) {
      alert('Please upload 0.5 Mile Comps file')
      return
    }
    if (!directComps) {
      alert('Please upload Direct Comps file')
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/admin/upload/process', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectProperty: subjectData,
          compsData: directComps.data,
          halfMileComps: halfMileComps.data,
          allScopesComps: allScopesComps?.data || [],
          mcaoData: subjectData,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        // Generate filename: "client-name-timestamp.xlsx"
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const safeClientName = (clientName || 'client').replace(/[^a-zA-Z0-9-]/g, '-')
        a.download = `${safeClientName}-${timestamp}.xlsx`

        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to generate report')
      }
    } catch (error) {
      alert('Error generating report')
    } finally {
      setGenerating(false)
    }
  }

  const allDataReady = subjectData && halfMileComps && directComps

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-black">Upload MLS Data</h1>
        <p className="text-gray-600 mt-1">
          Upload comp files and generate populated Excel template
        </p>
      </div>

      {/* Client Selection */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Select Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter client ID (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name for file naming"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Subject Property */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">2. Subject Property (APN)</h2>
          {subjectData && (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={subjectAPN}
            onChange={(e) => setSubjectAPN(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFetchSubject()}
            placeholder="Enter APN (e.g., 123-45-678)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
          />
          <button
            onClick={handleFetchSubject}
            disabled={loadingSubject}
            className="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>{loadingSubject ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>

        {subjectError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{subjectError}</p>
          </div>
        )}

        {subjectData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>APN:</strong> {subjectData.apn}</div>
              <div><strong>Address:</strong> {subjectData.propertyAddress?.fullAddress}</div>
              <div><strong>Owner:</strong> {subjectData.ownerName}</div>
              <div><strong>Value:</strong> ${subjectData.assessedValue?.total?.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {/* 0.5 Mile Comps */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">3. Half Mile Comps (.5 Mile)</h2>
          {halfMileComps && (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
        </div>

        <div className="space-y-3">
          <label className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-red cursor-pointer transition-colors text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-600">
              {halfMileComps?.fileName || 'Choose CSV/Excel file for 0.5 mile comps'}
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'halfMile')
              }}
              className="hidden"
              disabled={loadingHalfMile}
            />
          </label>

          {loadingHalfMile && (
            <div className="text-center text-sm text-gray-600">Processing...</div>
          )}

          {halfMileError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{halfMileError}</p>
            </div>
          )}

          {halfMileComps && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✓ Processed {halfMileComps.propertiesCount} properties from {halfMileComps.fileName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Direct Comps */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">4. Direct Comps</h2>
          {directComps && (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
        </div>

        <div className="space-y-3">
          <label className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-red cursor-pointer transition-colors text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-600">
              {directComps?.fileName || 'Choose CSV/Excel file for direct comps'}
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'direct')
              }}
              className="hidden"
              disabled={loadingDirect}
            />
          </label>

          {loadingDirect && (
            <div className="text-center text-sm text-gray-600">Processing...</div>
          )}

          {directError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{directError}</p>
            </div>
          )}

          {directComps && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✓ Processed {directComps.propertiesCount} properties from {directComps.fileName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* All Scopes (Optional) */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">5. All Scopes <span className="text-sm text-gray-500 font-normal">(Optional)</span></h2>
          </div>
          {allScopesComps && (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
        </div>

        <div className="space-y-3">
          <label className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-red cursor-pointer transition-colors text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-600">
              {allScopesComps?.fileName || 'Choose CSV/Excel file for all scopes (optional)'}
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'allScopes')
              }}
              className="hidden"
              disabled={loadingAllScopes}
            />
          </label>

          {loadingAllScopes && (
            <div className="text-center text-sm text-gray-600">Processing...</div>
          )}

          {allScopesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{allScopesError}</p>
            </div>
          )}

          {allScopesComps && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✓ Processed {allScopesComps.propertiesCount} properties from {allScopesComps.fileName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Button */}
      <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">6. Generate Excel Template</h2>
            <p className="text-sm text-gray-600">
              {allDataReady
                ? 'All data ready! Click to generate populated Excel file'
                : 'Complete all steps above to enable report generation'}
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={!allDataReady || generating}
            className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
              allDataReady && !generating
                ? 'bg-brand-red text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Download className="w-5 h-5" />
            <span>{generating ? 'Generating...' : 'Generate & Download'}</span>
          </button>
        </div>

        {allDataReady && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Output file:</strong> {clientName || 'client'}-{new Date().toISOString().slice(0, 10)}.xlsx
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Instructions</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Step 1:</strong> Enter client information (optional, used for file naming)</p>
          <p><strong>Step 2:</strong> Enter the subject property APN and click Fetch to get property data</p>
          <p><strong>Step 3:</strong> Upload CSV/Excel file containing properties within 0.5 mile radius</p>
          <p><strong>Step 4:</strong> Upload CSV/Excel file containing direct comparable properties</p>
          <p><strong>Step 5:</strong> Click Generate to download the populated Excel template</p>
          <p className="mt-4"><strong>File naming:</strong> Downloads will be named: <code className="bg-gray-100 px-2 py-1 rounded">[client-name]-[timestamp].xlsx</code></p>
        </div>
      </div>
    </div>
  )
}

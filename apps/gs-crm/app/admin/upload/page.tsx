'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Download, Search, AlertCircle, CheckCircle, FileSpreadsheet, ChevronDown, FileText } from 'lucide-react'
import { MCAOCategorizedData } from '../../../components/admin/MCAOCategorizedData'
import { getAllClients, type GSRealtyClient } from '@/lib/database/clients'

interface UploadedData {
  fileName: string
  propertiesCount: number
  data: any[]
}

export default function UploadPage() {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [clients, setClients] = useState<GSRealtyClient[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [subjectAPN, setSubjectAPN] = useState('')
  const [subjectData, setSubjectData] = useState<any>(null)

  // Subject Property Manual Inputs (for Analysis sheet Row 2)
  const [subjectBedrooms, setSubjectBedrooms] = useState('')
  const [subjectBathrooms, setSubjectBathrooms] = useState('')
  const [subjectLatitude, setSubjectLatitude] = useState('')
  const [subjectLongitude, setSubjectLongitude] = useState('')
  const [subjectFullAddress, setSubjectFullAddress] = useState('')
  const [subjectDwellingType, setSubjectDwellingType] = useState('')
  const [subjectYearBuilt, setSubjectYearBuilt] = useState('')

  // Track each upload type - 4 MLS upload types
  const [residential15Mile, setResidential15Mile] = useState<UploadedData | null>(null)
  const [residentialLease15Mile, setResidentialLease15Mile] = useState<UploadedData | null>(null)
  const [residential3YrDirect, setResidential3YrDirect] = useState<UploadedData | null>(null)
  const [residentialLease3YrDirect, setResidentialLease3YrDirect] = useState<UploadedData | null>(null)

  // Loading states
  const [loadingSubject, setLoadingSubject] = useState(false)
  const [loadingRes15, setLoadingRes15] = useState(false)
  const [loadingResLease15, setLoadingResLease15] = useState(false)
  const [loadingRes3Yr, setLoadingRes3Yr] = useState(false)
  const [loadingResLease3Yr, setLoadingResLease3Yr] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Scoring mode toggle (Stage 1: vision greyed out, calibrated is default)
  // Stage 2: change default to 'vision' once pipeline is deployed and validated
  const [scoringMode, setScoringMode] = useState<'vision' | 'calibrated'>('calibrated')
  const [scoringProvider, setScoringProvider] = useState<'gemini' | 'claude'>('gemini')

  // Vision scoring state (8C)
  const [res15Pdf, setRes15Pdf] = useState<{ path: string; pages: number } | null>(null)
  const [resLease15Pdf, setResLease15Pdf] = useState<{ path: string; pages: number } | null>(null)
  const [res3YrPdf, setRes3YrPdf] = useState<{ path: string; pages: number } | null>(null)
  const [resLease3YrPdf, setResLease3YrPdf] = useState<{ path: string; pages: number } | null>(null)
  const [scoringProgress, setScoringProgress] = useState<string | null>(null)
  const [visionScores, setVisionScores] = useState<any[] | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [cacheInfo, setCacheInfo] = useState<{ cached: number; toScore: number } | null>(null)

  // Step 6: Report generation state
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null)
  const [reportStatus, setReportStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle')
  const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)

  // Errors
  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [res15Error, setRes15Error] = useState<string | null>(null)
  const [resLease15Error, setResLease15Error] = useState<string | null>(null)
  const [res3YrError, setRes3YrError] = useState<string | null>(null)
  const [resLease3YrError, setResLease3YrError] = useState<string | null>(null)

  // Load clients on mount
  useEffect(() => {
    async function loadClients() {
      const { clients } = await getAllClients()
      if (clients) {
        setClients(clients)
      }
    }
    loadClients()
  }, [])

  // Hydrate cached vision scores when client is selected in vision mode
  useEffect(() => {
    if (!selectedClientId || scoringMode !== 'vision') {
      setBatchId(null)
      setCacheInfo(null)
      return
    }

    fetch(`/api/admin/upload/scores?clientId=${selectedClientId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.scores?.length > 0) {
          setBatchId(data.batch?.id || null)
          setVisionScores(data.scores.map((s: any) => ({
            address: s.address,
            score: s.renovation_score,
            renoYear: s.reno_year_estimate,
            confidence: s.confidence,
            dwellingType: s.dwelling_subtype || 'residential',
          })))
          setScoringProgress(`Loaded ${data.scores.length} cached scores from previous run`)
        } else {
          setBatchId(null)
          setVisionScores(null)
          setScoringProgress(null)
        }
      })
      .catch(() => {
        // Silently fail — cache is optional
      })
  }, [selectedClientId, scoringMode])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filtered clients for dropdown
  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    return fullName.includes(clientSearchTerm.toLowerCase())
  })

  // Handle client selection
  const handleSelectClient = (client: GSRealtyClient) => {
    setSelectedClientId(client.id)
    setClientName(client.last_name)
    setClientSearchTerm(`${client.first_name} ${client.last_name}`)
    setShowClientDropdown(false)
  }

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
        setSubjectData(result) // Store full MCAOLookupResult
      } else {
        // Show detailed error message
        const errorMsg = result.details || result.error || 'Failed to fetch property data'
        setSubjectError(`MCAO API Error: ${errorMsg}. The API may be unavailable. You can proceed without subject property data.`)
      }
    } catch (error: any) {
      setSubjectError(`Network error: ${error.message}. The MCAO API may be unavailable. You can proceed without subject property data.`)
    } finally {
      setLoadingSubject(false)
    }
  }

  // Upload and process CSV files
  const handleFileUpload = async (
    file: File,
    type: 'res15' | 'resLease15' | 'res3Yr' | 'resLease3Yr'
  ) => {
    const setLoading =
      type === 'res15' ? setLoadingRes15 :
      type === 'resLease15' ? setLoadingResLease15 :
      type === 'res3Yr' ? setLoadingRes3Yr :
      setLoadingResLease3Yr

    const setError =
      type === 'res15' ? setRes15Error :
      type === 'resLease15' ? setResLease15Error :
      type === 'res3Yr' ? setRes3YrError :
      setResLease3YrError

    const setData =
      type === 'res15' ? setResidential15Mile :
      type === 'resLease15' ? setResidentialLease15Mile :
      type === 'res3Yr' ? setResidential3YrDirect :
      setResidentialLease3YrDirect

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadType', type)
      if (selectedClientId) formData.append('clientId', selectedClientId)

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

  // Handle PDF upload for vision scoring
  const handlePdfUpload = async (file: File, type: 'res15' | 'resLease15' | 'res3Yr' | 'resLease3Yr') => {
    if (!selectedClientId) {
      alert('Please select a client first')
      return
    }

    try {
      // Get signed upload URL
      const urlRes = await fetch('/api/admin/upload/upload-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          files: [{ fileName: file.name, contentType: 'application/pdf', fileSize: file.size }],
        }),
      })

      if (!urlRes.ok) {
        const err = await urlRes.json()
        alert(err.error || 'Failed to get upload URL')
        return
      }

      const { uploadUrls } = await urlRes.json()
      const { signedUrl, storagePath, token } = uploadUrls[0]

      // Upload to Supabase Storage
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
        body: file,
      })

      if (!uploadResponse.ok) {
        alert(`PDF upload failed: ${uploadResponse.statusText}`)
        return
      }

      // Read actual page count from PDF
      let actualPages = 1
      try {
        const { PDFDocument } = await import('pdf-lib')
        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        actualPages = pdfDoc.getPageCount()
      } catch {
        // Fallback to size estimate if pdf-lib fails
        actualPages = Math.max(1, Math.round(file.size / 50000))
      }
      const pdfInfo = { path: storagePath, pages: actualPages }

      const setters: Record<string, any> = {
        res15: setRes15Pdf,
        resLease15: setResLease15Pdf,
        res3Yr: setRes3YrPdf,
        resLease3Yr: setResLease3YrPdf,
      }
      setters[type](pdfInfo)
    } catch (error) {
      alert('Error uploading PDF')
    }
  }

  // Generate final Excel report with timestamp naming
  const handleGenerateReport = async () => {
    if (!residential15Mile || !residentialLease15Mile || !residential3YrDirect || !residentialLease3YrDirect) {
      alert('Please upload all 4 MLS comp files')
      return
    }

    setGenerating(true)
    setScoringProgress(null)
    setVisionScores(null)
    setCacheInfo(null)

    try {
      let scores: any[] | undefined = undefined

      // Vision scoring path
      const uploadedPdfs = [res15Pdf, resLease15Pdf, res3YrPdf, resLease3YrPdf].filter(Boolean)
      if (scoringMode === 'vision' && uploadedPdfs.length > 0) {
        // Cost estimate (Gemini ~$0.002/page, Claude ~$0.025/page)
        const totalPages = uploadedPdfs.reduce((sum, p) => sum + (p?.pages || 0), 0)
        const costPerPage = scoringProvider === 'gemini' ? 0.002 : 0.025
        const providerLabel = scoringProvider === 'gemini' ? 'Gemini 2.5 Flash' : 'Claude Sonnet 4'
        const estimatedCost = (totalPages * costPerPage).toFixed(2)
        const confirmed = window.confirm(
          `Vision scoring (${providerLabel}) will process ~${totalPages} pages.\nEstimated cost: ~$${estimatedCost}\n\nProceed?`
        )
        if (!confirmed) {
          setGenerating(false)
          return
        }

        setScoringProgress('Starting vision scoring...')

        // Collect all property data for dwelling type detection
        const allPropertyData = [
          ...(residential15Mile?.data || []),
          ...(residentialLease15Mile?.data || []),
          ...(residential3YrDirect?.data || []),
          ...(residentialLease3YrDirect?.data || []),
        ]

        // Call score-pdf SSE endpoint
        const sseRes = await fetch('/api/admin/upload/score-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storagePaths: uploadedPdfs.map(p => p!.path),
            propertyData: allPropertyData,
            clientId: selectedClientId,
            options: { scoringProvider },
          }),
        })

        if (!sseRes.ok || !sseRes.body) {
          setScoringProgress('Vision scoring failed')
        } else {
          // Read SSE stream
          const reader = sseRes.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue
                try {
                  const event = JSON.parse(data)
                  setScoringProgress(event.message || event.type)
                  if (event.type === 'cache_check') {
                    setCacheInfo({ cached: event.cached || 0, toScore: event.toScore || 0 })
                  }
                  if (event.type === 'scoring_complete' && event.result) {
                    if (event.batchId) setBatchId(event.batchId)
                    scores = event.result.scores.map((s: any) => ({
                      address: s.address,
                      score: s.renovationScore ?? s.renovation_score,
                      renoYear: s.renoYearEstimate ?? s.reno_year_estimate,
                      confidence: s.confidence,
                      dwellingType: s.propertySubtype || s.dwelling_subtype || 'residential',
                    }))
                    setVisionScores(scores || null)
                    const costInfo = event.fromCache ? ' ($0 - from cache)' : ''
                    setScoringProgress(
                      `Scored ${event.result.stats.scored}/${event.result.stats.total} properties${costInfo}` +
                      (event.result.stats.failed > 0 ? ` (${event.result.stats.failed} failed)` : '')
                    )
                  }
                  if (event.type === 'error') {
                    setScoringProgress(`Error: ${event.error || event.message}`)
                  }
                } catch {
                  // Skip non-JSON lines (keepalive comments)
                }
              }
            }
          }
        }
      }

      // Generate Excel (with or without vision scores)
      const response = await fetch('/api/admin/upload/generate-excel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectProperty: subjectData || null,
          residential15Mile: residential15Mile.data,
          residentialLease15Mile: residentialLease15Mile.data,
          residential3YrDirect: residential3YrDirect.data,
          residentialLease3YrDirect: residentialLease3YrDirect.data,
          mcaoData: subjectData || null,
          clientName: clientName || 'Client',
          subjectManualInputs: {
            bedrooms: subjectBedrooms ? parseFloat(subjectBedrooms) : undefined,
            bathrooms: subjectBathrooms ? parseFloat(subjectBathrooms) : undefined,
            latitude: subjectLatitude ? parseFloat(subjectLatitude) : undefined,
            longitude: subjectLongitude ? parseFloat(subjectLongitude) : undefined,
            fullAddress: subjectFullAddress || undefined,
            dwellingType: subjectDwellingType || undefined,
            yearBuilt: subjectYearBuilt ? parseInt(subjectYearBuilt) : undefined,
          },
          visionScores: scores,
          batchId: batchId,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const now = new Date()
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
        const lastName = (clientName || 'Client').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')
        a.download = `Upload_${lastName}_${timestamp}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        // Save blob for optional Step 6 report generation
        setExcelBlob(blob)
        setReportStatus('idle')
        setReportDownloadUrl(null)
        setReportError(null)
      } else {
        alert('Failed to generate report')
      }
    } catch (error) {
      alert('Error generating report')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateFullReport = async () => {
    if (!excelBlob) return
    setReportStatus('generating')
    setReportError(null)
    try {
      const now = new Date()
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      const lastName = (clientName || 'Client').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')

      const formData = new FormData()
      formData.append('file', excelBlob, `Upload_${lastName}_${timestamp}.xlsx`)
      formData.append('type', 'breakups')

      const response = await fetch('/api/admin/reportit/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Report generation failed')
      }

      const data = await response.json()
      setReportDownloadUrl(data.data.downloadUrl)
      setReportStatus('complete')
    } catch (error: any) {
      setReportError(error.message || 'Failed to generate report')
      setReportStatus('error')
    }
  }

  // Check if all required data is uploaded
  const allDataReady = residential15Mile && residentialLease15Mile && residential3YrDirect && residentialLease3YrDirect

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Upload MLS Data</h1>
        <p className="text-white/60 mt-1">
          Upload MLS comp files and generate populated Excel template for ReportIt analysis
        </p>
      </div>

      {/* Scoring Mode Toggle */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/60">Scoring Mode:</span>
          <div className="flex rounded-xl overflow-hidden border border-white/20">
            <button
              onClick={() => setScoringMode('calibrated')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-700 ease-out ${
                scoringMode === 'calibrated'
                  ? 'bg-white/15 text-white border-r border-white/30'
                  : 'bg-white/5 text-white/60 border-r border-white/20 hover:bg-white/10'
              }`}
            >
              Calibrated Scoring
            </button>
            <button
              onClick={() => setScoringMode('vision')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-700 ease-out ${
                scoringMode === 'vision'
                  ? 'bg-white/15 text-white border-l border-white/30'
                  : 'bg-white/5 text-white/60 border-l border-white/20 hover:bg-white/10'
              }`}
            >
              AI Vision Scoring
            </button>
          </div>
          {scoringMode === 'vision' && (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
              <span className="text-sm text-white/40">Model:</span>
              <div className="flex rounded-lg overflow-hidden border border-white/15">
                <button
                  onClick={() => setScoringProvider('gemini')}
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-700 ease-out ${
                    scoringProvider === 'gemini'
                      ? 'bg-blue-500/20 text-blue-300 border-r border-blue-400/30'
                      : 'bg-white/5 text-white/40 border-r border-white/15 hover:bg-white/10'
                  }`}
                >
                  Gemini 2.5 Flash
                  <span className="ml-1 text-[10px] text-green-400/70">~$0.002/pg</span>
                </button>
                <button
                  onClick={() => setScoringProvider('claude')}
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-700 ease-out ${
                    scoringProvider === 'claude'
                      ? 'bg-orange-500/20 text-orange-300 border-l border-orange-400/30'
                      : 'bg-white/5 text-white/40 border-l border-white/15 hover:bg-white/10'
                  }`}
                >
                  Claude Sonnet 4
                  <span className="ml-1 text-[10px] text-white/30">~$0.025/pg</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Selection */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">1. Select Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Client Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value)
                  setShowClientDropdown(true)
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Search for client or type to filter..."
                className="w-full px-4 py-2 pr-10 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
              />
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 cursor-pointer"
                onClick={() => setShowClientDropdown(!showClientDropdown)}
              />
            </div>

            {/* Dropdown */}
            {showClientDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-h-60 overflow-auto">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                    >
                      <div className="font-medium">{client.first_name} {client.last_name}</div>
                      {client.email && (
                        <div className="text-xs text-white/50">{client.email}</div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-white/50">
                    No clients found
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Client Last Name (for file naming)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter or modify last name"
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
            />
            <p className="text-xs text-white/50 mt-1">This will be used in the output filename</p>
          </div>
        </div>
      </div>

      {/* Subject Property */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">2. Subject Property (APN) <span className="text-sm text-white/50 font-normal">(Optional)</span></h2>
            <p className="text-sm text-white/60 mt-1">Fetch property data from MCAO - Optional for report generation</p>
          </div>
          {subjectData && (
            <CheckCircle className="w-6 h-6 text-green-400" />
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={subjectAPN}
            onChange={(e) => setSubjectAPN(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFetchSubject()}
            placeholder="Enter APN (e.g., 123-45-678)"
            className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
          />
          <button
            onClick={handleFetchSubject}
            disabled={loadingSubject}
            className="px-6 py-2 bg-brand-red text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>{loadingSubject ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>

        {subjectError && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
            <p className="text-sm text-red-300">{subjectError}</p>
          </div>
        )}

        {subjectData && (
          <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4 mb-4">
            {subjectData.categorizedData ? (
              <MCAOCategorizedData
                categorizedData={subjectData.categorizedData}
                fieldCount={subjectData.fieldCount}
                apn={subjectData.data?.apn || subjectAPN}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm text-white">
                <div><strong>APN:</strong> {subjectData.data?.apn || subjectAPN}</div>
                <div><strong>Address:</strong> {subjectData.data?.propertyAddress?.fullAddress}</div>
                <div><strong>Owner:</strong> {subjectData.data?.ownerName}</div>
                <div><strong>Value:</strong> ${subjectData.data?.assessedValue?.total?.toLocaleString()}</div>
              </div>
            )}
          </div>
        )}

        {/* Manual Inputs for Subject Property (Analysis Row 2) */}
        {subjectData && (
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              Subject Property Details (for Analysis Sheet Row 2)
            </h3>
            <p className="text-xs text-white/60 mb-3">
              These values will override MCAO data for the subject property in the Analysis sheet.
              Leave blank to use MCAO data when available.
            </p>

            {/* Row 1: Full Address */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-white/80 mb-1">
                Full Address (replaces "Subject Property" placeholder)
              </label>
              <input
                type="text"
                value={subjectFullAddress}
                onChange={(e) => setSubjectFullAddress(e.target.value)}
                placeholder="e.g., 1234 N Main St, Phoenix, AZ 85001"
                className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
              />
            </div>

            {/* Row 2: Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={subjectBedrooms}
                  onChange={(e) => setSubjectBedrooms(e.target.value)}
                  placeholder="e.g., 3"
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={subjectBathrooms}
                  onChange={(e) => setSubjectBathrooms(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Year Built
                </label>
                <input
                  type="number"
                  step="1"
                  value={subjectYearBuilt}
                  onChange={(e) => setSubjectYearBuilt(e.target.value)}
                  placeholder="e.g., 1995"
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Dwelling Type
                </label>
                <select
                  value={subjectDwellingType}
                  onChange={(e) => setSubjectDwellingType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded-xl text-white focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                >
                  <option value="">Select type...</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Single Family Residence">Single Family Residence</option>
                  <option value="Loft Style">Loft Style</option>
                </select>
              </div>
            </div>

            {/* Row 3: Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={subjectLatitude}
                  onChange={(e) => setSubjectLatitude(e.target.value)}
                  placeholder="e.g., 33.4942"
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={subjectLongitude}
                  onChange={(e) => setSubjectLongitude(e.target.value)}
                  placeholder="e.g., -111.9261"
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1.5 Mile Comps - Two uploads */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">3. 1.5 Mile Comps</h2>
          <div className="flex space-x-2">
            {residential15Mile && <CheckCircle className="w-5 h-5 text-green-400" />}
            {residentialLease15Mile && <CheckCircle className="w-5 h-5 text-green-400" />}
          </div>
        </div>

        {/* Residential 1.5 Mile */}
        <div className="space-y-3 mb-4">
          <h3 className="text-sm font-semibold text-white/80">a. Residential 1.5mile-comps</h3>
          <label className="block w-full px-4 py-6 border-2 border-dashed border-white/30 rounded-xl hover:border-white/50 bg-white/5 cursor-pointer transition-colors text-center">
            <Upload className="w-6 h-6 text-white/40 mx-auto mb-2" />
            <span className="text-sm text-white/60">
              {residential15Mile?.fileName || 'Choose CSV/Excel file for Residential 1.5 mile comps'}
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'res15')
              }}
              className="hidden"
              disabled={loadingRes15}
            />
          </label>
          {loadingRes15 && <div className="text-center text-sm text-white/60">Processing...</div>}
          {res15Error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
              <p className="text-sm text-red-300">{res15Error}</p>
            </div>
          )}
          {residential15Mile && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3">
              <p className="text-sm text-green-300">
                ✓ Processed {residential15Mile.propertiesCount} properties
              </p>
            </div>
          )}
          {scoringMode === 'vision' && (
            <>
              <label className="block w-full px-4 py-4 border-2 border-dashed border-purple-400/30 rounded-xl hover:border-purple-400/50 bg-purple-500/5 cursor-pointer transition-colors text-center">
                <Upload className="w-5 h-5 text-purple-400/60 mx-auto mb-1" />
                <span className="text-sm text-purple-300/60">
                  {res15Pdf ? `PDF uploaded (${res15Pdf.pages} pages)` : '7-Photo Flyer PDF (optional)'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePdfUpload(file, 'res15')
                  }}
                  className="hidden"
                />
              </label>
              {res15Pdf && (
                <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-3">
                  <p className="text-sm text-purple-300">
                    ✓ PDF ready: ~{res15Pdf.pages} pages
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Residential Lease 1.5 Mile */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">b. Residential Lease 1.5mile-comps</h3>
          <label className="block w-full px-4 py-6 border-2 border-dashed border-white/30 rounded-xl hover:border-white/50 bg-white/5 cursor-pointer transition-colors text-center">
            <Upload className="w-6 h-6 text-white/40 mx-auto mb-2" />
            <span className="text-sm text-white/60">
              {residentialLease15Mile?.fileName || 'Choose CSV/Excel file for Residential Lease 1.5 mile comps'}
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'resLease15')
              }}
              className="hidden"
              disabled={loadingResLease15}
            />
          </label>
          {loadingResLease15 && <div className="text-center text-sm text-white/60">Processing...</div>}
          {resLease15Error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
              <p className="text-sm text-red-300">{resLease15Error}</p>
            </div>
          )}
          {residentialLease15Mile && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3">
              <p className="text-sm text-green-300">
                ✓ Processed {residentialLease15Mile.propertiesCount} properties
              </p>
            </div>
          )}
          {scoringMode === 'vision' && (
            <>
              <label className="block w-full px-4 py-4 border-2 border-dashed border-purple-400/30 rounded-xl hover:border-purple-400/50 bg-purple-500/5 cursor-pointer transition-colors text-center">
                <Upload className="w-5 h-5 text-purple-400/60 mx-auto mb-1" />
                <span className="text-sm text-purple-300/60">
                  {resLease15Pdf ? `PDF uploaded (${resLease15Pdf.pages} pages)` : '7-Photo Flyer PDF (optional)'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePdfUpload(file, 'resLease15')
                  }}
                  className="hidden"
                />
              </label>
              {resLease15Pdf && (
                <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-3">
                  <p className="text-sm text-purple-300">
                    ✓ PDF ready: ~{resLease15Pdf.pages} pages
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3 Year Direct Subdivision Comps - Two uploads */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">4. 3 Year Direct Subdivision Comps</h2>
          <div className="flex space-x-2">
            {residential3YrDirect && <CheckCircle className="w-5 h-5 text-green-400" />}
            {residentialLease3YrDirect && <CheckCircle className="w-5 h-5 text-green-400" />}
          </div>
        </div>

        {/* Residential 3yr Direct */}
        <div className="space-y-3 mb-4">
          <h3 className="text-sm font-semibold text-white/80">a. Residential 3yr-direct-subdivision-comps</h3>
          <label className="block w-full px-4 py-6 border-2 border-dashed border-white/30 rounded-xl hover:border-white/50 bg-white/5 cursor-pointer transition-colors text-center">
            <Upload className="w-6 h-6 text-white/40 mx-auto mb-2" />
            <span className="text-sm text-white/60">
              {residential3YrDirect?.fileName || 'Choose CSV/Excel file for Residential 3yr direct subdivision comps'}
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'res3Yr')
              }}
              className="hidden"
              disabled={loadingRes3Yr}
            />
          </label>
          {loadingRes3Yr && <div className="text-center text-sm text-white/60">Processing...</div>}
          {res3YrError && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
              <p className="text-sm text-red-300">{res3YrError}</p>
            </div>
          )}
          {residential3YrDirect && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3">
              <p className="text-sm text-green-300">
                ✓ Processed {residential3YrDirect.propertiesCount} properties
              </p>
            </div>
          )}
          {scoringMode === 'vision' && (
            <>
              <label className="block w-full px-4 py-4 border-2 border-dashed border-purple-400/30 rounded-xl hover:border-purple-400/50 bg-purple-500/5 cursor-pointer transition-colors text-center">
                <Upload className="w-5 h-5 text-purple-400/60 mx-auto mb-1" />
                <span className="text-sm text-purple-300/60">
                  {res3YrPdf ? `PDF uploaded (${res3YrPdf.pages} pages)` : '7-Photo Flyer PDF (optional)'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePdfUpload(file, 'res3Yr')
                  }}
                  className="hidden"
                />
              </label>
              {res3YrPdf && (
                <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-3">
                  <p className="text-sm text-purple-300">
                    ✓ PDF ready: ~{res3YrPdf.pages} pages
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Residential Lease 3yr Direct */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">b. Residential Lease 3yr-direct-subdivision-comps</h3>
          <label className="block w-full px-4 py-6 border-2 border-dashed border-white/30 rounded-xl hover:border-white/50 bg-white/5 cursor-pointer transition-colors text-center">
            <Upload className="w-6 h-6 text-white/40 mx-auto mb-2" />
            <span className="text-sm text-white/60">
              {residentialLease3YrDirect?.fileName || 'Choose CSV/Excel file for Residential Lease 3yr direct subdivision comps'}
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'resLease3Yr')
              }}
              className="hidden"
              disabled={loadingResLease3Yr}
            />
          </label>
          {loadingResLease3Yr && <div className="text-center text-sm text-white/60">Processing...</div>}
          {resLease3YrError && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
              <p className="text-sm text-red-300">{resLease3YrError}</p>
            </div>
          )}
          {residentialLease3YrDirect && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3">
              <p className="text-sm text-green-300">
                ✓ Processed {residentialLease3YrDirect.propertiesCount} properties
              </p>
            </div>
          )}
          {scoringMode === 'vision' && (
            <>
              <label className="block w-full px-4 py-4 border-2 border-dashed border-purple-400/30 rounded-xl hover:border-purple-400/50 bg-purple-500/5 cursor-pointer transition-colors text-center">
                <Upload className="w-5 h-5 text-purple-400/60 mx-auto mb-1" />
                <span className="text-sm text-purple-300/60">
                  {resLease3YrPdf ? `PDF uploaded (${resLease3YrPdf.pages} pages)` : '7-Photo Flyer PDF (optional)'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePdfUpload(file, 'resLease3Yr')
                  }}
                  className="hidden"
                />
              </label>
              {resLease3YrPdf && (
                <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-3">
                  <p className="text-sm text-purple-300">
                    ✓ PDF ready: ~{resLease3YrPdf.pages} pages
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Generate Report Button */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">5. Generate Excel Template</h2>
            <p className="text-sm text-white/60">
              {allDataReady
                ? 'All 4 MLS files uploaded! Click to generate populated Excel file for ReportIt'
                : 'Upload all 4 MLS comp files to enable report generation'}
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={!allDataReady || generating}
            className={`px-8 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors ${
              allDataReady && !generating
                ? 'bg-brand-red text-white hover:bg-red-700'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Download className="w-5 h-5" />
            <span>{generating ? 'Generating...' : 'Generate & Download'}</span>
          </button>
        </div>

        {scoringProgress && (
          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-400/30 rounded-xl">
            <p className="text-sm text-purple-300">{scoringProgress}</p>
          </div>
        )}

        {visionScores && batchId && !generating && (
          <div className="mt-2 p-3 bg-green-500/10 border border-green-400/30 rounded-xl">
            <p className="text-sm text-green-300">
              {visionScores.length} scores saved in database (batch {batchId.slice(0, 8)}...)
              — Excel can be regenerated for free
            </p>
          </div>
        )}

        {cacheInfo && cacheInfo.cached > 0 && (
          <div className="mt-2 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
            <p className="text-sm text-blue-300">
              Cache: {cacheInfo.cached} already scored, {cacheInfo.toScore} new
            </p>
          </div>
        )}

        {allDataReady && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
            <p className="text-sm text-blue-300">
              <strong>Output file:</strong> Upload_{clientName || 'Client'}_{new Date().toISOString().slice(0, 10).replace(/-/g, '-')}-{String(new Date().getHours()).padStart(2, '0')}{String(new Date().getMinutes()).padStart(2, '0')}.xlsx
            </p>
            <p className="text-sm text-blue-300 mt-1">
              This file includes RENOVATE_SCORE (1-10) and RENO_YEAR_EST columns for ReportIt processing
            </p>
          </div>
        )}
      </div>

      {/* Step 6: Generate Full Report (optional, appears after Excel download) */}
      {excelBlob && (
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">6. Generate Full Report (Optional)</h2>
              <p className="text-sm text-white/60">
                Generate Break-ups analysis package with charts, PDF report, and PropertyRadar export
              </p>
            </div>
          </div>

          {reportStatus === 'idle' && (
            <button
              onClick={handleGenerateFullReport}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-all duration-700 flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>Generate Full Report</span>
            </button>
          )}

          {reportStatus === 'generating' && (
            <div className="flex items-center justify-center space-x-3 py-4">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white/80">Generating report... this may take up to 60 seconds</span>
            </div>
          )}

          {reportStatus === 'complete' && reportDownloadUrl && (
            <div className="space-y-3">
              <div className="p-3 bg-green-500/10 border border-green-400/30 rounded-xl flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-medium">Report package ready!</span>
              </div>
              <button
                onClick={() => window.open(reportDownloadUrl, '_blank')}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all duration-700 flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download Report Package (.zip)</span>
              </button>
            </div>
          )}

          {reportStatus === 'error' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-xl">
                <p className="text-red-300">{reportError || 'Report generation failed'}</p>
              </div>
              <button
                onClick={handleGenerateFullReport}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-all duration-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">MLS Upload Instructions</h3>
        <div className="space-y-2 text-sm text-white/60">
          <p><strong className="text-white/80">Step 1:</strong> Select client from dropdown or enter client last name (used for file naming)</p>
          <p><strong className="text-white/80">Step 2:</strong> Enter subject property APN to fetch MCAO data (optional - if API is available)</p>
          <div className="pl-4">
            <p><strong className="text-white/80">Step 3: 1.5 Mile Comps</strong></p>
            <p className="pl-4">a. Upload Residential 1.5mile-comps (T-12 months, ±1 BR/BA, ±20% sqft/lot)</p>
            <p className="pl-4">b. Upload Residential Lease 1.5mile-comps (T-12 months, ±1 BR/BA, ±20% sqft/lot)</p>
          </div>
          <div className="pl-4">
            <p><strong className="text-white/80">Step 4: 3 Year Direct Subdivision Comps</strong></p>
            <p className="pl-4">a. Upload Residential 3yr-direct-subdivision-comps (T-36 months, same HOA/subdivision)</p>
            <p className="pl-4">b. Upload Residential Lease 3yr-direct-subdivision-comps (T-36 months, same HOA/subdivision)</p>
          </div>
          <p><strong className="text-white/80">Step 5:</strong> Click Generate to download Upload_LastName_Timestamp.xlsx</p>
          <p><strong className="text-white/80">Step 6:</strong> (Optional) Click Generate Full Report for Break-ups analysis package</p>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
            <p className="font-semibold text-yellow-300">Notes:</p>
            <ol className="list-decimal list-inside mt-2 text-yellow-400">
              <li>Review AI-scored RENOVATE_SCORE (Column R, 1-10) — adjust any scores and fill blanks for unscored properties. Optionally add/verify RENO_YEAR_EST (Column AD).</li>
              <li>Add Property Radar comp data if available (Columns AE-AP)</li>
              <li>Use Step 6 above for immediate report generation, or save as Complete_LastName_Timestamp.xlsx and upload to ReportIt manually</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
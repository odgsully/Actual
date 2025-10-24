'use client'

import { useState, useCallback } from 'react'
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  message?: string
  progress?: number
  downloadUrl?: string
}

type UploadType = 'breakups' | 'propertyradar'

export default function ReportItPage() {
  const [breakupsStatus, setBreakupsStatus] = useState<UploadStatus>({ status: 'idle' })
  const [propertyRadarStatus, setPropertyRadarStatus] = useState<UploadStatus>({ status: 'idle' })
  const [dragActiveBreakups, setDragActiveBreakups] = useState(false)
  const [dragActivePropertyRadar, setDragActivePropertyRadar] = useState(false)
  const { toast } = useToast()

  const handleDrag = useCallback((e: React.DragEvent, type: UploadType) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      if (type === 'breakups') {
        setDragActiveBreakups(true)
      } else {
        setDragActivePropertyRadar(true)
      }
    } else if (e.type === "dragleave") {
      if (type === 'breakups') {
        setDragActiveBreakups(false)
      } else {
        setDragActivePropertyRadar(false)
      }
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: UploadType) => {
    e.preventDefault()
    e.stopPropagation()

    if (type === 'breakups') {
      setDragActiveBreakups(false)
    } else {
      setDragActivePropertyRadar(false)
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], type)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: UploadType) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], type)
    }
  }

  const handleFile = async (file: File, type: UploadType) => {
    // Validate file type
    if (!file.name.match(/Complete_.*\.xlsx$/)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a file matching: Complete_LastName_YYYY-MM-DD-HHMM.xlsx",
        variant: "destructive"
      })
      return
    }

    const setStatus = type === 'breakups' ? setBreakupsStatus : setPropertyRadarStatus

    setStatus({ status: 'uploading', message: 'Uploading file...', progress: 0 })

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        progress: Math.min((prev.progress || 0) + 10, 90)
      }))
    }, 200)

    try {
      // TODO: Implement actual file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      // Simulated API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000))

      clearInterval(progressInterval)

      const processingMessage = type === 'breakups'
        ? 'Processing data and generating break-ups analyses...'
        : 'Extracting PropertyRadar data from Complete file...'

      setStatus({
        status: 'processing',
        message: processingMessage,
        progress: 100
      })

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // TODO: Replace with actual download URL from API
      const downloadUrl = type === 'breakups'
        ? `/api/admin/reportit/download/breakups`
        : `/api/admin/reportit/download/propertyradar`

      const successMessage = type === 'breakups'
        ? 'Break-ups report generated successfully!'
        : 'PropertyRadar file generated successfully!'

      setStatus({
        status: 'complete',
        message: successMessage,
        downloadUrl
      })

      toast({
        title: "Success!",
        description: successMessage,
      })

    } catch (error) {
      clearInterval(progressInterval)
      setStatus({
        status: 'error',
        message: 'An error occurred while processing your file.'
      })
      toast({
        title: "Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDownload = (type: UploadType) => {
    const status = type === 'breakups' ? breakupsStatus : propertyRadarStatus
    if (status.downloadUrl) {
      window.open(status.downloadUrl, '_blank')
    }
  }

  const resetUpload = (type: UploadType) => {
    if (type === 'breakups') {
      setBreakupsStatus({ status: 'idle' })
    } else {
      setPropertyRadarStatus({ status: 'idle' })
    }
  }

  const renderUploadCard = (
    type: UploadType,
    status: UploadStatus,
    dragActive: boolean,
    title: string,
    description: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {status.status === 'idle' && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center hover:border-gray-400 transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onDragEnter={(e) => handleDrag(e, type)}
            onDragLeave={(e) => handleDrag(e, type)}
            onDragOver={(e) => handleDrag(e, type)}
            onDrop={(e) => handleDrop(e, type)}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop your Complete_*.xlsx file here, or click to browse
            </p>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => handleFileSelect(e, type)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button className="mt-4">
              Select File
            </Button>
          </div>
        )}

        {status.status === 'uploading' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">{status.message}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>
        )}

        {status.status === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="text-sm text-gray-600">{status.message}</span>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {type === 'breakups'
                  ? 'Processing includes: 22 break-ups analyses, visualization generation, and report packaging. This may take up to 30 seconds.'
                  : 'Extracting Property Radar data columns from your Complete file. This takes just a few seconds.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {status.status === 'complete' && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {status.message}
              </AlertDescription>
            </Alert>
            <div className="flex space-x-4">
              <Button onClick={() => handleDownload(type)} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>
                  {type === 'breakups' ? 'Download Break-ups Report (.zip)' : 'Download PropertyRadar (.xlsx)'}
                </span>
              </Button>
              <Button variant="outline" onClick={() => resetUpload(type)}>
                Upload Another File
              </Button>
            </div>
          </div>
        )}

        {status.status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
            <Button onClick={() => resetUpload(type)}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ReportIt</h1>
        <p className="text-gray-600 mt-2">
          Upload completed Excel files for comprehensive property analysis
        </p>
      </div>

      {/* Upload Cards - Two Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderUploadCard(
          'breakups',
          breakupsStatus,
          dragActiveBreakups,
          'Upload for Break-ups Report',
          'Upload your Complete_*.xlsx file to generate comprehensive 22 break-ups analyses package'
        )}

        {renderUploadCard(
          'propertyradar',
          propertyRadarStatus,
          dragActivePropertyRadar,
          'Upload for PropertyRadar',
          'Upload your Complete_*.xlsx file to extract PropertyRadar data into separate template'
        )}
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Before uploading, ensure:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>File is named: Complete_LastName_YYYY-MM-DD-HHMM.xlsx</li>
              <li>RENOVATE_SCORE column (R) is filled with Y, N, or 0.5</li>
              <li>Property Radar column (S) is filled with Y/N if applicable</li>
              <li>File contains sheets: MLS-Resi-Comps, MLS-Lease-Comps, Full-MCAO-API, Analysis</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Two Upload Options:</h3>
            <div className="ml-4 space-y-3">
              <div>
                <p className="font-medium text-sm text-gray-700">1. Break-ups Report (.zip)</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                  <li>Enhanced Excel with 22 break-ups analyses</li>
                  <li>Professional visualizations (charts and graphs)</li>
                  <li>5 PDF reports (Executive Summary, Comparative Analysis, etc.)</li>
                  <li>Raw data files for transparency</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-sm text-gray-700">2. PropertyRadar File (.xlsx)</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                  <li>Separate Excel file with 12 Property Radar comp columns</li>
                  <li>Ready for manual data entry and tracking</li>
                  <li>Template format: PropertyRadar_LastName_Timestamp.xlsx</li>
                  <li>Upload the same Complete file to extract PropertyRadar data</li>
                </ul>
              </div>
            </div>
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Files should be placed in <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">/RE/Pending-Bin/</code> before uploading here.
              After processing, they will be moved to <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">/RE/Completed/</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

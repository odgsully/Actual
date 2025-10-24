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

export default function ReportItPage() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' })
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.match(/Complete_.*\.xlsx$/)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a file matching: Complete_LastName_YYYY-MM-DD-HHMM.xlsx",
        variant: "destructive"
      })
      return
    }

    setUploadStatus({ status: 'uploading', message: 'Uploading file...', progress: 0 })

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadStatus(prev => ({
        ...prev,
        progress: Math.min((prev.progress || 0) + 10, 90)
      }))
    }, 200)

    try {
      // TODO: Implement actual file upload
      const formData = new FormData()
      formData.append('file', file)

      // Simulated API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000))

      clearInterval(progressInterval)
      setUploadStatus({
        status: 'processing',
        message: 'Processing data and generating analyses...',
        progress: 100
      })

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // TODO: Replace with actual download URL from API
      const downloadUrl = `/api/admin/reportit/download/sample`

      setUploadStatus({
        status: 'complete',
        message: 'Report generation complete!',
        downloadUrl
      })

      toast({
        title: "Success!",
        description: "Your report has been generated and is ready for download.",
      })

    } catch (error) {
      clearInterval(progressInterval)
      setUploadStatus({
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

  const handleDownload = () => {
    if (uploadStatus.downloadUrl) {
      // TODO: Implement actual download
      window.open(uploadStatus.downloadUrl, '_blank')
    }
  }

  const resetUpload = () => {
    setUploadStatus({ status: 'idle' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ReportIt</h1>
        <p className="text-gray-600 mt-2">
          Upload completed Excel files for comprehensive property analysis
        </p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Complete Excel File</CardTitle>
          <CardDescription>
            Upload your Complete_LastName_Timestamp.xlsx file with RENOVATE_SCORE and Property Radar data filled in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadStatus.status === 'idle' && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center hover:border-gray-400 transition-colors
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your Complete_*.xlsx file here, or click to browse
              </p>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button className="mt-4">
                Select File
              </Button>
            </div>
          )}

          {uploadStatus.status === 'uploading' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">{uploadStatus.message}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadStatus.status === 'processing' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                <span className="text-sm text-gray-600">{uploadStatus.message}</span>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Processing includes: 22 break-ups analyses, visualization generation, and report packaging.
                  This may take up to 30 seconds.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {uploadStatus.status === 'complete' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {uploadStatus.message}
                </AlertDescription>
              </Alert>
              <div className="flex space-x-4">
                <Button onClick={handleDownload} className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Download Break-ups Report (.zip)</span>
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  Upload Another File
                </Button>
              </div>
            </div>
          )}

          {uploadStatus.status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadStatus.message}</AlertDescription>
              </Alert>
              <Button onClick={resetUpload}>Try Again</Button>
            </div>
          )}
        </CardContent>
      </Card>

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
              <li>Property Radar columns (S, AD-AO) are filled if applicable</li>
              <li>File contains sheets: MLS-Comps, Full-MCAO-API, Analysis</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Output package includes:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Enhanced Excel with 22 break-ups analyses</li>
              <li>Professional visualizations (charts and graphs)</li>
              <li>5 PDF reports (Executive Summary, Comparative Analysis, etc.)</li>
              <li>Raw data files for transparency</li>
            </ul>
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
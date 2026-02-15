'use client'

import { useState, useCallback } from 'react'
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2, Package } from 'lucide-react'
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
      const file = e.dataTransfer.files[0]

      // Validate file type is xlsx
      if (!file.name.endsWith('.xlsx')) {
        toast({
          title: "Invalid file format",
          description: "Please upload an Excel file (.xlsx)",
          variant: "destructive"
        })
        return
      }

      setSelectedFile(file)
    }
  }, [toast])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file type is xlsx
      if (!file.name.endsWith('.xlsx')) {
        toast({
          title: "Invalid file format",
          description: "Please upload an Excel file (.xlsx)",
          variant: "destructive"
        })
        return
      }

      setSelectedFile(file)
    }
  }

  const confirmAndUpload = async () => {
    if (selectedFile) {
      await handleFile(selectedFile)
    }
  }

  const handleFile = async (file: File) => {
    setUploadStatus({ status: 'uploading', message: 'Uploading file...', progress: 0 })

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadStatus(prev => ({
        ...prev,
        progress: Math.min((prev.progress || 0) + 10, 90)
      }))
    }, 200)

    try {
      // Upload file to API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'breakups') // Always use breakups type for unified flow

      // Make actual API call
      const uploadResponse = await fetch('/api/admin/reportit/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error?.message || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()

      setUploadStatus({
        status: 'processing',
        message: 'Processing complete analysis: 22 breakups analyses, charts, PDFs, and PropertyRadar export...',
        progress: 100
      })

      // Simulate processing time (in real implementation, this would be actual processing)
      await new Promise(resolve => setTimeout(resolve, 2000))

      setUploadStatus({
        status: 'complete',
        message: 'Complete report package generated successfully!',
        downloadUrl: uploadData.data.downloadUrl
      })

      toast({
        title: "Success!",
        description: 'Complete report package with PropertyRadar export ready for download!',
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
      window.open(uploadStatus.downloadUrl, '_blank')
    }
  }

  const resetUpload = () => {
    setUploadStatus({ status: 'idle' })
    setSelectedFile(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">ReportIt - Complete Property Analysis</h1>
        <p className="text-white/60 mt-2">
          Upload your Complete_*.xlsx file to generate a comprehensive analysis package
        </p>
      </div>

      {/* Main Upload Card */}
      <Card className="glass-card">
        <CardHeader className="bg-white/5 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-400" />
            <div>
              <CardTitle className="text-2xl text-white">Upload Complete Property Analysis</CardTitle>
              <CardDescription className="text-base mt-1 text-white/60">
                Single upload generates everything you need: analyses, charts, PDFs, and PropertyRadar export
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Required File Info */}
          <Alert className="mb-6 bg-blue-500/10 border-blue-400/30">
            <FileText className="h-4 w-4 text-blue-300" />
            <AlertDescription>
              <div className="font-medium mb-2 text-blue-200">Required: Complete_*.xlsx file with:</div>
              <ul className="text-sm space-y-1 ml-4 text-blue-300">
                <li>✓ MLS-Resi-Comps sheet</li>
                <li>✓ MLS-Lease-Comps sheet</li>
                <li>✓ Full-MCAO-API sheet</li>
                <li>✓ Analysis sheet (with all columns including PropertyRadar data)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {uploadStatus.status === 'idle' && (
            <>
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors
                  ${dragActive ? 'border-white/50 bg-white/10' : 'border-white/30 hover:border-white/40 bg-white/5'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-white/40" />
                <p className="mt-2 text-sm text-white/60">
                  Drag and drop your Complete Excel file (.xlsx) here, or click to browse
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

              {/* Green ribbon showing selected file */}
              {selectedFile && (
                <div className="mt-4 bg-green-500/20 border-l-4 border-green-400 p-4 rounded-r-xl">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-green-300">
                        File Selected
                      </p>
                      <p className="text-sm text-green-400 mt-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-green-400/70 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <Button
                      onClick={confirmAndUpload}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Upload & Generate Full Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedFile(null)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {uploadStatus.status === 'uploading' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-sm text-white/60">{uploadStatus.message}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadStatus.status === 'processing' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                <span className="text-sm text-white/60">{uploadStatus.message}</span>
              </div>
              <Alert className="bg-white/5 border-white/20">
                <AlertCircle className="h-4 w-4 text-white/60" />
                <AlertDescription className="text-white/60">
                  Processing includes: 22 break-ups analyses, 22 charts, 5 PDF reports, PropertyRadar export, and complete data package. This may take up to 30 seconds.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {uploadStatus.status === 'complete' && (
            <div className="space-y-4">
              <Alert className="border-green-400/30 bg-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  {uploadStatus.message}
                </AlertDescription>
              </Alert>

              {/* Output Includes Section */}
              <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4">
                <h3 className="font-semibold text-green-300 mb-3">Package Contents:</h3>
                <ul className="space-y-2 text-sm text-green-400">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>22 Comparative Analyses</strong> - Complete property breakdowns</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>22 Visualization Charts</strong> - High-quality PNG graphics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>5 Professional PDF Reports</strong> - Executive summaries and deep dives</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>PropertyRadar Export</strong> - Ready-to-use Excel template</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Complete Data Package</strong> - JSON, CSV, and summary files</span>
                  </li>
                </ul>
              </div>

              <div className="flex space-x-4">
                <Button onClick={handleDownload} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4" />
                  <span>Download Complete Report Package (.zip)</span>
                </Button>
                <Button variant="outline" onClick={resetUpload} className="border-white/20 text-white hover:bg-white/10">
                  Upload Another File
                </Button>
              </div>
            </div>
          )}

          {uploadStatus.status === 'error' && (
            <div className="space-y-4">
              <Alert className="bg-red-500/20 border-red-400/30">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{uploadStatus.message}</AlertDescription>
              </Alert>
              <Button onClick={resetUpload}>Try Again</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">What Gets Generated</CardTitle>
          <CardDescription className="text-white/60">Complete package contents from a single upload</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-white">Analysis & Data:</h3>
              <ul className="list-disc list-inside text-sm text-white/60 space-y-1">
                <li>22 comparative analyses</li>
                <li>Enhanced Excel file with all calculations</li>
                <li>PropertyRadar export (columns AD-AO)</li>
                <li>Complete property data CSV</li>
                <li>Summary statistics JSON</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-white">Visualizations & Reports:</h3>
              <ul className="list-disc list-inside text-sm text-white/60 space-y-1">
                <li>22 high-quality PNG charts (300 DPI)</li>
                <li>Executive Summary PDF</li>
                <li>Property Characteristics PDF</li>
                <li>Market Analysis PDF</li>
                <li>Financial Analysis PDF</li>
                <li>Market Activity PDF</li>
              </ul>
            </div>
          </div>

          <Alert className="bg-white/5 border-white/20">
            <FileText className="h-4 w-4 text-white/60" />
            <AlertDescription className="text-white/60">
              All outputs are packaged in a single ZIP file named: <code className="font-mono text-xs bg-white/10 px-1 py-0.5 rounded text-white">Breakups_Report_ClientName_Date.zip</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

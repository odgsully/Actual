'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { FieldMapping, SkippedRow, ErrorRow } from '@/lib/database/contact-import'

// Steps in the upload flow
type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

// Parsed file data from API
interface ParsedFileData {
  fileName: string
  fileType: 'csv' | 'xlsx'
  totalRows: number
  columns: string[]
  sampleRows: Record<string, string>[]
  suggestedMapping: FieldMapping
}

// Preview data from API
interface PreviewData {
  summary: {
    totalRows: number
    validCount: number
    skipCount: number
    errorCount: number
  }
  preview: Array<{
    row: number
    status: 'valid' | 'skip' | 'error'
    reason?: string
    data?: Record<string, string | null>
  }>
  allSkipped: SkippedRow[]
  allErrors: ErrorRow[]
}

// Import result from API
interface ImportResult {
  batchId: string
  importedCount: number
  skippedCount: number
  errorCount: number
}

// Target fields that can be mapped
const TARGET_FIELDS: { key: keyof FieldMapping; label: string; required: boolean }[] = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'client_type', label: 'Client Type', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'notes', label: 'Notes', required: false },
]

export default function ContactUploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null)
  const [mapping, setMapping] = useState<FieldMapping>({
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    address: null,
    client_type: null,
    status: null,
    notes: null,
  })
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // File drop handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const uploadedFile = acceptedFiles[0]
    setFile(uploadedFile)
    setError(null)
    setLoading(true)

    try {
      // Parse file
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('/api/admin/contacts/upload/parse', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to parse file')
        setFile(null)
        return
      }

      setParsedData(result.data)
      setMapping(result.data.suggestedMapping)
      setStep('mapping')
    } catch (err) {
      console.error('Error parsing file:', err)
      setError('Failed to parse file. Please try again.')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: loading,
  })

  // Handle mapping change
  const handleMappingChange = (field: keyof FieldMapping, value: string | null) => {
    setMapping(prev => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  // Preview import
  const handlePreview = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping))

      const response = await fetch('/api/admin/contacts/upload/preview', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to preview import')
        return
      }

      setPreviewData(result.data)
      setStep('preview')
    } catch (err) {
      console.error('Error previewing import:', err)
      setError('Failed to preview import. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Execute import
  const handleImport = async () => {
    if (!file) return

    setStep('importing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping))

      const response = await fetch('/api/admin/contacts/upload/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to import contacts')
        setStep('preview')
        return
      }

      setImportResult(result.data)
      setStep('complete')
    } catch (err) {
      console.error('Error importing contacts:', err)
      setError('Failed to import contacts. Please try again.')
      setStep('preview')
    }
  }

  // Reset form
  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setParsedData(null)
    setMapping({
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      address: null,
      client_type: null,
      status: null,
      notes: null,
    })
    setPreviewData(null)
    setImportResult(null)
    setError(null)
  }

  // Check if mapping is valid (required fields mapped)
  const isMappingValid = mapping.first_name && mapping.last_name

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contact Upload</h1>
          <p className="text-white/60 mt-1">Import contacts from CSV or Excel files</p>
        </div>
        <Link href="/admin/contacts/upload/history">
          <Button className="glass-button">
            <History className="w-4 h-4 mr-2" />
            Import History
          </Button>
        </Link>
      </div>

      {/* Progress Steps */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          {['Upload', 'Map Fields', 'Preview', 'Import'].map((label, index) => {
            const stepIndex = ['upload', 'mapping', 'preview', 'importing'].indexOf(step)
            const isComplete = index < stepIndex || step === 'complete'
            const isCurrent = index === stepIndex || (step === 'complete' && index === 3)

            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isComplete ? 'bg-green-500 text-white' : ''}
                      ${isCurrent && !isComplete ? 'bg-brand-red text-white' : ''}
                      ${!isComplete && !isCurrent ? 'bg-white/10 text-white/40' : ''}
                    `}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isCurrent || isComplete ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      isComplete ? 'bg-green-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="glass-card p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card className="glass-card p-8">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
              transition-all duration-300
              ${isDragActive ? 'border-brand-red bg-brand-red/10' : 'border-white/20 hover:border-white/40'}
              ${loading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {loading ? (
                <Loader2 className="w-12 h-12 text-white/60 animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-white/60" />
              )}
              <div>
                <p className="text-white text-lg font-medium">
                  {isDragActive
                    ? 'Drop your file here...'
                    : loading
                    ? 'Parsing file...'
                    : 'Drag and drop your CSV or Excel file here'}
                </p>
                <p className="text-white/60 mt-1">or click to browse</p>
              </div>
              <p className="text-white/40 text-sm">
                Supported: .csv, .xlsx (max 5,000 contacts)
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/5">
            <h4 className="text-white font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              Tips for successful import
            </h4>
            <ul className="mt-2 text-white/60 text-sm space-y-1">
              <li>• First row should contain column headers</li>
              <li>• Required fields: First Name, Last Name</li>
              <li>• Contacts with duplicate email or phone will be skipped</li>
              <li>• Empty rows will be ignored</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && parsedData && (
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Map Your Fields</h2>
              <p className="text-white/60 mt-1">
                Match your file columns to contact fields
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <FileSpreadsheet className="w-5 h-5" />
              <span>{parsedData.fileName}</span>
              <span className="text-white/40">•</span>
              <span>{parsedData.totalRows} rows</span>
            </div>
          </div>

          <div className="space-y-4">
            {TARGET_FIELDS.map(field => (
              <div
                key={field.key}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
              >
                <div className="w-40">
                  <span className="text-white font-medium">{field.label}</span>
                  {field.required && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
                <select
                  value={mapping[field.key] || ''}
                  onChange={e => handleMappingChange(field.key, e.target.value)}
                  className="flex-1 glass-input py-2 px-3 rounded-lg bg-white/5 border border-white/20 text-white"
                >
                  <option value="" className="bg-gray-900">
                    {field.required ? 'Select column...' : "(Don't import)"}
                  </option>
                  {parsedData.columns.map(col => (
                    <option key={col} value={col} className="bg-gray-900">
                      {col}
                    </option>
                  ))}
                </select>
                {mapping[field.key] && (
                  <Check className="w-5 h-5 text-green-400" />
                )}
              </div>
            ))}
          </div>

          {/* Sample Data Preview */}
          {parsedData.sampleRows.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-medium mb-3">Sample Data (First 5 Rows)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {parsedData.columns.slice(0, 6).map(col => (
                        <th
                          key={col}
                          className="text-left text-white/60 py-2 px-3 font-medium"
                        >
                          {col}
                        </th>
                      ))}
                      {parsedData.columns.length > 6 && (
                        <th className="text-white/40 py-2 px-3">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.sampleRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {parsedData.columns.slice(0, 6).map(col => (
                          <td key={col} className="text-white/80 py-2 px-3 truncate max-w-[150px]">
                            {row[col] || '-'}
                          </td>
                        ))}
                        {parsedData.columns.length > 6 && (
                          <td className="text-white/40 py-2 px-3">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="glass-button"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handlePreview}
              disabled={!isMappingValid || loading}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  Preview Import
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Step: Preview */}
      {step === 'preview' && previewData && (
        <Card className="glass-card p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Import Preview</h2>
            <p className="text-white/60 mt-1">
              Review before importing {previewData.summary.validCount} contacts
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">
                  {previewData.summary.validCount}
                </span>
              </div>
              <p className="text-white/60 text-sm mt-1">Ready to import</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">
                  {previewData.summary.skipCount}
                </span>
              </div>
              <p className="text-white/60 text-sm mt-1">Duplicates (will skip)</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-semibold">
                  {previewData.summary.errorCount}
                </span>
              </div>
              <p className="text-white/60 text-sm mt-1">Errors (will skip)</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <h3 className="text-white font-medium mb-3">First 10 Rows</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 py-2 px-3 font-medium w-16">Row</th>
                  <th className="text-left text-white/60 py-2 px-3 font-medium">First Name</th>
                  <th className="text-left text-white/60 py-2 px-3 font-medium">Last Name</th>
                  <th className="text-left text-white/60 py-2 px-3 font-medium">Email</th>
                  <th className="text-left text-white/60 py-2 px-3 font-medium">Phone</th>
                  <th className="text-left text-white/60 py-2 px-3 font-medium w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewData.preview.map(row => (
                  <tr key={row.row} className="border-b border-white/5">
                    <td className="text-white/60 py-2 px-3">{row.row}</td>
                    <td className="text-white/80 py-2 px-3">
                      {row.data?.first_name || '-'}
                    </td>
                    <td className="text-white/80 py-2 px-3">
                      {row.data?.last_name || '-'}
                    </td>
                    <td className="text-white/80 py-2 px-3 truncate max-w-[150px]">
                      {row.data?.email || '-'}
                    </td>
                    <td className="text-white/80 py-2 px-3">
                      {row.data?.phone || '-'}
                    </td>
                    <td className="py-2 px-3">
                      {row.status === 'valid' && (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      )}
                      {row.status === 'skip' && (
                        <span className="inline-flex items-center gap-1 text-yellow-400 text-xs">
                          <AlertTriangle className="w-3 h-3" /> Skip
                        </span>
                      )}
                      {row.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                          <X className="w-3 h-3" /> Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Skipped/Error Details */}
          {(previewData.allSkipped.length > 0 || previewData.allErrors.length > 0) && (
            <div className="mt-6 space-y-4">
              {previewData.allSkipped.length > 0 && (
                <details className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <summary className="text-yellow-400 font-medium cursor-pointer">
                    View {previewData.allSkipped.length} skipped rows
                  </summary>
                  <div className="mt-3 space-y-1 text-sm">
                    {previewData.allSkipped.slice(0, 10).map((row, i) => (
                      <p key={i} className="text-white/60">
                        Row {row.row}: {row.reason === 'duplicate_email' ? `Email "${row.email}" already exists` : `Phone "${row.phone}" already exists`}
                      </p>
                    ))}
                    {previewData.allSkipped.length > 10 && (
                      <p className="text-white/40">
                        ...and {previewData.allSkipped.length - 10} more
                      </p>
                    )}
                  </div>
                </details>
              )}

              {previewData.allErrors.length > 0 && (
                <details className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <summary className="text-red-400 font-medium cursor-pointer">
                    View {previewData.allErrors.length} error rows
                  </summary>
                  <div className="mt-3 space-y-1 text-sm">
                    {previewData.allErrors.slice(0, 10).map((row, i) => (
                      <p key={i} className="text-white/60">
                        Row {row.row}: {row.reason === 'missing_first_name' ? 'First name is required' : row.reason === 'missing_last_name' ? 'Last name is required' : row.reason === 'invalid_email' ? 'Invalid email format' : 'Parse error'}
                      </p>
                    ))}
                    {previewData.allErrors.length > 10 && (
                      <p className="text-white/40">
                        ...and {previewData.allErrors.length - 10} more
                      </p>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => setStep('mapping')}
              className="glass-button"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Mapping
            </Button>
            <Button
              onClick={handleImport}
              disabled={previewData.summary.validCount === 0}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              Import {previewData.summary.validCount} Contacts
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <Card className="glass-card p-12">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-16 h-16 text-brand-red animate-spin mb-6" />
            <h2 className="text-2xl font-semibold text-white">Importing Contacts...</h2>
            <p className="text-white/60 mt-2">Please don&apos;t close this window</p>
          </div>
        </Card>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <Card className="glass-card p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Import Complete!</h2>
            <p className="text-white/60 mt-2">
              Successfully imported {importResult.importedCount} contacts
            </p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
              <p className="text-3xl font-bold text-green-400">{importResult.importedCount}</p>
              <p className="text-white/60 text-sm mt-1">Imported</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
              <p className="text-3xl font-bold text-yellow-400">{importResult.skippedCount}</p>
              <p className="text-white/60 text-sm mt-1">Skipped</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
              <p className="text-3xl font-bold text-red-400">{importResult.errorCount}</p>
              <p className="text-white/60 text-sm mt-1">Errors</p>
            </div>
          </div>

          <div className="text-center text-white/40 text-sm mb-8">
            Import ID: {importResult.batchId}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="glass-button"
            >
              Upload Another
            </Button>
            <Button
              onClick={() => router.push('/admin/clients')}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              Go to Contacts
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

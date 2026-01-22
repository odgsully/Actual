'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  FileSpreadsheet,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import type { ImportBatch, ImportStatus } from '@/lib/database/contact-import'

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Get status display config
function getStatusConfig(status: ImportStatus) {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        label: 'Completed',
        className: 'text-green-400 bg-green-500/10',
      }
    case 'rolled_back':
      return {
        icon: RotateCcw,
        label: 'Rolled Back',
        className: 'text-gray-400 bg-gray-500/10',
      }
    case 'failed':
      return {
        icon: XCircle,
        label: 'Failed',
        className: 'text-red-400 bg-red-500/10',
      }
    case 'processing':
      return {
        icon: Loader2,
        label: 'Processing',
        className: 'text-blue-400 bg-blue-500/10',
      }
    case 'pending':
    default:
      return {
        icon: Clock,
        label: 'Pending',
        className: 'text-yellow-400 bg-yellow-500/10',
      }
  }
}

export default function ImportHistoryPage() {
  const router = useRouter()
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rollbackingId, setRollbackingId] = useState<string | null>(null)
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null)

  // Fetch import history
  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/admin/contacts/upload/history')
        const result = await response.json()

        if (!result.success) {
          setError(result.error || 'Failed to fetch import history')
          return
        }

        setBatches(result.data.batches)
      } catch (err) {
        console.error('Error fetching import history:', err)
        setError('Failed to fetch import history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  // Handle rollback
  const handleRollback = async (batchId: string) => {
    setRollbackingId(batchId)
    setConfirmRollback(null)

    try {
      const response = await fetch(`/api/admin/contacts/upload/batch/${batchId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to rollback import')
        return
      }

      // Update local state
      setBatches(prev =>
        prev.map(batch =>
          batch.id === batchId
            ? { ...batch, status: 'rolled_back', rolled_back_at: new Date().toISOString() }
            : batch
        )
      )
    } catch (err) {
      console.error('Error rolling back import:', err)
      setError('Failed to rollback import')
    } finally {
      setRollbackingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/contacts/upload">
            <Button variant="ghost" className="glass-button">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Import History</h1>
            <p className="text-white/60 mt-1">View past imports and rollback if needed</p>
          </div>
        </div>
      </div>

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

      {/* Loading State */}
      {loading && (
        <Card className="glass-card p-12">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-10 h-10 text-white/60 animate-spin mb-4" />
            <p className="text-white/60">Loading import history...</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && batches.length === 0 && (
        <Card className="glass-card p-12">
          <div className="flex flex-col items-center text-center">
            <FileSpreadsheet className="w-12 h-12 text-white/40 mb-4" />
            <h2 className="text-xl font-semibold text-white">No Imports Yet</h2>
            <p className="text-white/60 mt-2 mb-6">
              You haven&apos;t imported any contacts yet.
            </p>
            <Link href="/admin/contacts/upload">
              <Button className="bg-brand-red hover:bg-brand-red-hover text-white">
                Upload Contacts
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* History Table */}
      {!loading && batches.length > 0 && (
        <Card className="glass-card p-6">
          <div className="overflow-x-auto rounded-xl bg-white/5">
            <table className="w-full bg-transparent">
              <thead className="bg-white/5">
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 py-3 px-4 font-medium">File</th>
                  <th className="text-left text-white/70 py-3 px-4 font-medium">Date</th>
                  <th className="text-left text-white/70 py-3 px-4 font-medium">Imported</th>
                  <th className="text-left text-white/70 py-3 px-4 font-medium">Skipped</th>
                  <th className="text-left text-white/70 py-3 px-4 font-medium">Errors</th>
                  <th className="text-left text-white/70 py-3 px-4 font-medium">Status</th>
                  <th className="text-right text-white/70 py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="bg-transparent">
                {batches.map(batch => {
                  const statusConfig = getStatusConfig(batch.status)
                  const StatusIcon = statusConfig.icon
                  const canRollback = batch.status === 'completed' && batch.imported_count > 0

                  return (
                    <tr
                      key={batch.id}
                      className="border-b border-white/5 bg-transparent hover:bg-white/10 transition-colors duration-300"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-5 h-5 text-white/40" />
                          <div>
                            <p className="text-white font-medium truncate max-w-[200px]">
                              {batch.file_name}
                            </p>
                            <p className="text-white/40 text-xs uppercase">
                              {batch.file_type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white/80 text-sm">
                          {formatDate(batch.created_at)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-green-400 font-medium">
                          {batch.imported_count}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-yellow-400">
                          {batch.skipped_count}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-red-400">
                          {batch.error_count}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}
                        >
                          <StatusIcon
                            className={`w-3.5 h-3.5 ${
                              batch.status === 'processing' ? 'animate-spin' : ''
                            }`}
                          />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {canRollback && (
                          <>
                            {confirmRollback === batch.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-white/60 text-sm">Delete all?</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmRollback(null)}
                                  className="glass-button text-white/60 hover:text-white"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRollback(batch.id)}
                                  disabled={rollbackingId === batch.id}
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  {rollbackingId === batch.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Confirm'
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmRollback(batch.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Rollback
                              </Button>
                            )}
                          </>
                        )}
                        {batch.status === 'rolled_back' && (
                          <span className="text-white/40 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <Trash2 className="w-4 h-4" />
                <span>Rollback = delete all contacts from that import</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span>This action cannot be undone</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

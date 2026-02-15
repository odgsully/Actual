/**
 * Close Deal Confirm Modal Component
 *
 * Shown when user closes a property status and the linked deal
 * is not yet closed. Prompts user to also close the deal.
 */

'use client'

import { useState } from 'react'
import { X, FileCheck, AlertCircle } from 'lucide-react'

interface CloseDealConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  onSkip: () => void
  propertyAddress?: string
  dealStage?: string
}

// Stage labels for display
const stageLabels: Record<string, string> = {
  on_radar: 'On Radar',
  official_representation: 'Official Representation',
  touring: 'Touring',
  offers_in: 'Offers In',
  under_contract: 'Under Contract',
  closed: 'Closed',
}

export function CloseDealConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  propertyAddress,
  dealStage,
}: CloseDealConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('[CloseDealConfirmModal] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onSkip()
    onClose()
  }

  if (!isOpen) return null

  const stageLabel = dealStage ? stageLabels[dealStage] || dealStage : 'Active'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Close Linked Deal?</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-white/80 mb-4">
            You&apos;re closing the property status, but the linked deal is still at{' '}
            <span className="font-medium text-white">&quot;{stageLabel}&quot;</span> stage.
          </p>

          {propertyAddress && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl mb-4">
              <p className="text-sm text-white/60">Property:</p>
              <p className="text-white font-medium">{propertyAddress}</p>
            </div>
          )}

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-5">
            <div className="flex items-center gap-3 mb-2">
              <FileCheck className="h-5 w-5 text-green-400" />
              <span className="font-medium text-white">Also close the deal?</span>
            </div>
            <p className="text-sm text-white/60">
              This will mark the deal as &quot;Closed&quot; in the sales pipeline. The property and deal will become historical records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="
                w-full py-2.5 px-4 rounded-xl
                bg-green-500/30 border border-green-400/50 text-green-400 font-medium
                hover:bg-green-500/40
                transition-all duration-200
                disabled:opacity-50
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  Yes, Close Deal Too
                </>
              )}
            </button>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="
                w-full py-2.5 px-4 rounded-xl
                bg-white/5 border border-white/20 text-white/70
                hover:bg-white/10 hover:text-white
                transition-all duration-200
                disabled:opacity-50
              "
            >
              No, Keep Deal Open
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="
                w-full py-2 px-4 text-white/50
                hover:text-white
                transition-all duration-200
                disabled:opacity-50
                text-sm
              "
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

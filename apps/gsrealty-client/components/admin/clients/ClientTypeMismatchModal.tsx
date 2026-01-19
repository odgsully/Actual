/**
 * Client Type Mismatch Modal Component
 *
 * Warning modal shown when user tries to add a property type
 * that doesn't match the client's current type
 * (e.g., adding a "selling" property to a "buyer" client)
 *
 * Offers to change client type to "Both"
 */

'use client'

import { useState } from 'react'
import { AlertTriangle, X, UserCog } from 'lucide-react'
import type { ClientType } from '@/lib/database/clients'
import type { PropertyType } from '@/lib/database/client-properties'

interface ClientTypeMismatchModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  currentClientType: ClientType
  attemptedPropertyType: PropertyType
  clientName?: string
}

export function ClientTypeMismatchModal({
  isOpen,
  onClose,
  onConfirm,
  currentClientType,
  attemptedPropertyType,
  clientName,
}: ClientTypeMismatchModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('[ClientTypeMismatchModal] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isAddingSelling = attemptedPropertyType === 'selling'
  const typeLabel = currentClientType.charAt(0).toUpperCase() + currentClientType.slice(1)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Client Type Mismatch</h2>
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
            {clientName ? (
              <>
                <span className="font-medium text-white">{clientName}</span> is currently set as a{' '}
                <span className="font-medium text-white">&quot;{typeLabel}&quot;</span>
              </>
            ) : (
              <>
                This client is currently set as a{' '}
                <span className="font-medium text-white">&quot;{typeLabel}&quot;</span>
              </>
            )}{' '}
            but you&apos;re trying to add a{' '}
            <span className={`font-medium ${isAddingSelling ? 'text-pink-400' : 'text-blue-400'}`}>
              {isAddingSelling ? 'selling' : 'buying'}
            </span>{' '}
            property.
          </p>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-5">
            <div className="flex items-center gap-3 mb-2">
              <UserCog className="h-5 w-5 text-purple-400" />
              <span className="font-medium text-white">Change to &quot;Both&quot;?</span>
            </div>
            <p className="text-sm text-white/60">
              Updating the client type to &quot;Both&quot; will allow them to have both buying and selling properties.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="
                flex-1 py-2.5 px-4 rounded-xl
                bg-white/5 border border-white/20 text-white/70
                hover:bg-white/10 hover:text-white
                transition-all duration-200
                disabled:opacity-50
              "
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="
                flex-1 py-2.5 px-4 rounded-xl
                bg-purple-500/30 border border-purple-400/50 text-purple-400 font-medium
                hover:bg-purple-500/40
                transition-all duration-200
                disabled:opacity-50
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
              ) : (
                'Change to Both'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

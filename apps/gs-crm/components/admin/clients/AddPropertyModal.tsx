/**
 * Add Property Modal Component
 *
 * Modal for adding a new property to a client
 * Includes address input and property type (buying/selling) selection
 * Auto-creates a deal at "On Radar" stage when property is added
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Home, Plus } from 'lucide-react'
import type { PropertyType } from '@/lib/database/client-properties'

interface AddPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (address: string, propertyType: PropertyType, notes?: string) => Promise<void>
  defaultPropertyType?: PropertyType
  clientName?: string
}

export function AddPropertyModal({
  isOpen,
  onClose,
  onSubmit,
  defaultPropertyType = 'buying',
  clientName,
}: AddPropertyModalProps) {
  const [address, setAddress] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>(defaultPropertyType)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync propertyType when modal opens or defaultPropertyType changes
  useEffect(() => {
    if (isOpen) {
      setPropertyType(defaultPropertyType)
    }
  }, [isOpen, defaultPropertyType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!address.trim()) {
      setError('Property address is required')
      return
    }

    setLoading(true)
    try {
      await onSubmit(address.trim(), propertyType, notes.trim() || undefined)
      // Reset form and close
      setAddress('')
      setNotes('')
      setPropertyType(defaultPropertyType)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add property')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setAddress('')
    setNotes('')
    setError('')
    setPropertyType(defaultPropertyType)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Add Property</h2>
              {clientName && (
                <p className="text-sm text-white/50">for {clientName}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Property Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Property Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Phoenix, AZ 85001"
              disabled={loading}
              className="
                w-full px-4 py-2.5 rounded-xl
                bg-white/5 border border-white/20
                text-white placeholder:text-white/30
                focus:outline-none focus:border-white/40 focus:bg-white/10
                transition-all duration-200
                disabled:opacity-50
              "
            />
          </div>

          {/* Property Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Property Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPropertyType('buying')}
                disabled={loading}
                className={`
                  flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium
                  transition-all duration-200
                  ${
                    propertyType === 'buying'
                      ? 'bg-blue-500/30 border-blue-400/50 text-blue-400'
                      : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:text-white/80'
                  }
                  disabled:opacity-50
                `}
              >
                Buying
              </button>
              <button
                type="button"
                onClick={() => setPropertyType('selling')}
                disabled={loading}
                className={`
                  flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium
                  transition-all duration-200
                  ${
                    propertyType === 'selling'
                      ? 'bg-pink-500/30 border-pink-400/50 text-pink-400'
                      : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:text-white/80'
                  }
                  disabled:opacity-50
                `}
              >
                Selling
              </button>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Notes <span className="text-white/40">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this property..."
              disabled={loading}
              rows={3}
              className="
                w-full px-4 py-2.5 rounded-xl
                bg-white/5 border border-white/20
                text-white placeholder:text-white/30
                focus:outline-none focus:border-white/40 focus:bg-white/10
                transition-all duration-200
                disabled:opacity-50
                resize-none
              "
            />
          </div>

          {/* Info Box */}
          <div className="mb-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-400">
              A deal will automatically be created at the &quot;On Radar&quot; stage when you add this property.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
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
              type="submit"
              disabled={loading || !address.trim()}
              className="
                flex-1 py-2.5 px-4 rounded-xl
                bg-brand-red border border-brand-red text-white font-medium
                hover:bg-brand-red-hover
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Property
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

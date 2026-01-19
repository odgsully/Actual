/**
 * Property Card Component
 *
 * Displays a client property with status dropdown and deal stage badge
 * Supports active/inactive/closed states with appropriate UI
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, ExternalLink, Pencil, Trash2, ChevronDown } from 'lucide-react'
import type { ClientPropertyWithDeal, PropertyStatus } from '@/lib/database/client-properties'
import type { GSRealtyDeal } from '@/lib/database/deals'

interface PropertyCardProps {
  property: ClientPropertyWithDeal
  onStatusChange: (propertyId: string, status: PropertyStatus) => Promise<{ closeDealPrompt: boolean }>
  onEdit: (property: ClientPropertyWithDeal) => void
  onRemove: (propertyId: string) => void
  onCreateDeal?: (propertyId: string) => Promise<void>
}

// Stage display config
const stageConfig: Record<GSRealtyDeal['stage'], { label: string; color: string }> = {
  on_radar: { label: 'On Radar', color: 'bg-purple-500/20 text-purple-400 border-purple-400/30' },
  official_representation: { label: 'Official Rep', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
  touring: { label: 'Touring', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
  offers_in: { label: 'Offers In', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' },
  under_contract: { label: 'Under Contract', color: 'bg-orange-500/20 text-orange-400 border-orange-400/30' },
  closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400 border-gray-400/30' },
}

const statusOptions: { value: PropertyStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
]

export function PropertyCard({ property, onStatusChange, onEdit, onRemove, onCreateDeal }: PropertyCardProps) {
  const router = useRouter()
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [creatingDeal, setCreatingDeal] = useState(false)

  const deal = property.deal as GSRealtyDeal | null | undefined
  const isActive = property.status === 'active'
  const isClosed = property.status === 'closed'

  const handleStatusChange = async (newStatus: PropertyStatus) => {
    setStatusDropdownOpen(false)
    if (newStatus === property.status) return

    setUpdating(true)
    try {
      await onStatusChange(property.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  const handleViewInPipeline = () => {
    if (deal?.id) {
      router.push(`/admin/pipeline?deal=${deal.id}`)
    }
  }

  const handleCreateDeal = async () => {
    if (!onCreateDeal) return
    setCreatingDeal(true)
    try {
      await onCreateDeal(property.id)
    } finally {
      setCreatingDeal(false)
    }
  }

  return (
    <Card
      className={`
        bg-white/5 border border-white/10 rounded-xl p-4
        transition-all duration-300
        ${isClosed ? 'opacity-60' : 'hover:bg-white/10'}
      `}
    >
      {/* Property Address */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Home className="h-4 w-4 text-white/40 shrink-0" />
          <span className="text-white font-medium truncate">
            {property.property_address}
          </span>
        </div>

        {/* Type Badge */}
        <Badge
          className={`text-xs shrink-0 ${
            property.property_type === 'buying'
              ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
              : 'bg-pink-500/20 text-pink-400 border-pink-400/30'
          }`}
        >
          {property.property_type === 'buying' ? 'Buying' : 'Selling'}
        </Badge>
      </div>

      {/* Status and Stage Row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => !isClosed && setStatusDropdownOpen(!statusDropdownOpen)}
            disabled={updating || isClosed}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
              border transition-all duration-200
              ${
                isActive
                  ? 'bg-green-500/20 text-green-400 border-green-400/30'
                  : property.status === 'inactive'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-400/30'
              }
              ${!isClosed && !updating ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}
            `}
          >
            <span>Status: {property.status.charAt(0).toUpperCase() + property.status.slice(1)}</span>
            {!isClosed && <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Dropdown Menu */}
          {statusDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setStatusDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 z-20 bg-gray-900 border border-white/20 rounded-lg shadow-xl py-1 min-w-[120px]">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`
                      w-full px-3 py-1.5 text-left text-sm
                      ${option.value === property.status ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Deal Stage Badge (only if active and has deal) */}
        {isActive && deal && (
          <Badge className={`text-xs ${stageConfig[deal.stage].color}`}>
            {stageConfig[deal.stage].label}
          </Badge>
        )}

        {/* Not in pipeline message for inactive */}
        {!isActive && !isClosed && (
          <span className="text-xs text-white/40 italic">
            Not in pipeline
          </span>
        )}
      </div>

      {/* Notes (if any) */}
      {property.notes && (
        <p className="text-xs text-white/50 mb-3 line-clamp-2">
          {property.notes}
        </p>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        {/* View in Pipeline Button */}
        {isActive && deal ? (
          <button
            onClick={handleViewInPipeline}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View in Pipeline
          </button>
        ) : isActive && !deal && onCreateDeal ? (
          <button
            onClick={handleCreateDeal}
            disabled={creatingDeal}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
          >
            {creatingDeal ? (
              <>
                <div className="h-3 w-3 border border-purple-400/50 border-t-purple-400 rounded-full animate-spin" />
                Creating deal...
              </>
            ) : (
              <>
                <ExternalLink className="h-3 w-3" />
                Add to Pipeline
              </>
            )}
          </button>
        ) : !isActive && !isClosed ? (
          <span className="text-xs text-white/40">
            Set Active to add to pipeline
          </span>
        ) : isClosed ? (
          <span className="text-xs text-white/40">
            Closed
          </span>
        ) : (
          <span className="text-xs text-white/40">
            No deal linked
          </span>
        )}

        {/* Edit & Remove Buttons */}
        <div className="flex items-center gap-2">
          {!isClosed && (
            <button
              onClick={() => onEdit(property)}
              className="p-1.5 text-white/40 hover:text-white/80 hover:bg-white/10 rounded transition-all"
              title="Edit property"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onRemove(property.id)}
            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
            title="Remove property"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {(updating || creatingDeal) && (
        <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}
    </Card>
  )
}

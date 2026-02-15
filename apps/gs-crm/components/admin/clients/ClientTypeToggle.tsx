/**
 * Client Type Toggle Component
 *
 * Three-button toggle for selecting client type: Buyer, Seller, or Both
 * Uses glassmorphism styling with instant save on click
 */

'use client'

import { useState } from 'react'
import { User, Home, Users } from 'lucide-react'
import type { ClientType } from '@/lib/database/clients'

interface ClientTypeToggleProps {
  value: ClientType
  onChange: (type: ClientType) => Promise<void>
  disabled?: boolean
}

const typeConfig: Record<ClientType, { label: string; icon: typeof User; color: string }> = {
  buyer: {
    label: 'Buyer',
    icon: User,
    color: 'blue',
  },
  seller: {
    label: 'Seller',
    icon: Home,
    color: 'pink',
  },
  both: {
    label: 'Both',
    icon: Users,
    color: 'purple',
  },
}

export function ClientTypeToggle({ value, onChange, disabled = false }: ClientTypeToggleProps) {
  const [saving, setSaving] = useState(false)
  const [activeType, setActiveType] = useState<ClientType>(value)

  const handleClick = async (type: ClientType) => {
    if (disabled || saving || type === activeType) return

    setSaving(true)
    setActiveType(type)

    try {
      await onChange(type)
    } catch (error) {
      // Revert on error
      setActiveType(value)
      console.error('[ClientTypeToggle] Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/60 text-sm mr-2">Type:</span>
      <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
        {(Object.keys(typeConfig) as ClientType[]).map((type) => {
          const config = typeConfig[type]
          const Icon = config.icon
          const isActive = activeType === type

          // Color classes based on type
          const activeClasses = {
            buyer: 'bg-blue-500/30 text-blue-400 border-blue-400/50',
            seller: 'bg-pink-500/30 text-pink-400 border-pink-400/50',
            both: 'bg-purple-500/30 text-purple-400 border-purple-400/50',
          }

          return (
            <button
              key={type}
              onClick={() => handleClick(type)}
              disabled={disabled || saving}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-300 border
                ${
                  isActive
                    ? activeClasses[type]
                    : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
                }
                ${disabled || saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>
      {saving && (
        <div className="ml-2">
          <div className="h-4 w-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

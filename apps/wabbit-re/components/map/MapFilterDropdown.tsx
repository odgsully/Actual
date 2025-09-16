'use client'

import React, { useState, useEffect } from 'react'
import { useMapContext } from '@/contexts/MapContext'

interface MapFilterDropdownProps {
  showMap?: boolean
  onToggleMap?: () => void
}

const MapFilterDropdown: React.FC<MapFilterDropdownProps> = ({ 
  showMap = false, 
  onToggleMap 
}) => {
  const {
    searchAreas,
    isSaving,
    deleteSearchArea,
    toggleAreaActive,
    updateAreaPreference,
    clearAllAreas
  } = useMapContext()

  const [savingAreaId, setSavingAreaId] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState<string | null>(null)

  const handlePreferenceChange = async (areaId: string, preference: 'prefer' | 'dislike' | 'curious') => {
    setSavingAreaId(areaId)
    await updateAreaPreference(areaId, preference)
    
    // Show success briefly
    setTimeout(() => {
      setSavingAreaId(null)
      setShowSuccess(areaId)
      setTimeout(() => setShowSuccess(null), 1000)
    }, 300)
  }

  const getPreferenceColor = (preference: string) => {
    switch (preference) {
      case 'prefer':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'dislike':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'curious':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getPreferenceIcon = (preference: string) => {
    switch (preference) {
      case 'prefer':
        return '👍'
      case 'dislike':
        return '👎'
      case 'curious':
      default:
        return '🤔'
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Active Filters with Preference Dropdowns */}
      {searchAreas.map(area => (
        <div
          key={area.id}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border shadow-sm"
        >
          {/* Area Name and Status */}
          <div className="flex items-center gap-2">
            <span className={`font-medium ${area.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
              {area.area_name}
            </span>
            <span className="text-xs text-gray-500">
              ({area.is_inclusion ? 'Include' : 'Exclude'})
            </span>
          </div>

          {/* Preference Dropdown */}
          <div className="relative">
            {savingAreaId === area.id ? (
              // Saving indicator
              <div className="flex items-center justify-center w-24 h-8">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : showSuccess === area.id ? (
              // Success checkmark
              <div className="flex items-center justify-center w-24 h-8 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              // Preference dropdown
              <select
                value={area.preference || 'curious'}
                onChange={(e) => handlePreferenceChange(area.id, e.target.value as 'prefer' | 'dislike' | 'curious')}
                className={`px-2 py-1 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPreferenceColor(area.preference || 'curious')}`}
              >
                <option value="prefer">👍 Prefer</option>
                <option value="dislike">👎 Dislike</option>
                <option value="curious">🤔 Curious</option>
              </select>
            )}
          </div>

          {/* Active/Inactive Toggle */}
          <button
            onClick={() => toggleAreaActive(area.id)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              area.is_active
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {area.is_active ? 'Active' : 'Inactive'}
          </button>

          {/* Remove Button */}
          <button
            onClick={() => deleteSearchArea(area.id)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Clear All Button */}
      {searchAreas.length > 0 && (
        <button
          onClick={() => {
            if (confirm('Clear all map filters?')) {
              clearAllAreas()
            }
          }}
          className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
        >
          Clear All
        </button>
      )}
    </div>
  )
}

export default MapFilterDropdown
'use client'

/**
 * MCAO Categorized Data Display Component
 *
 * Displays all 559+ MCAO fields organized into collapsible categories
 * Based on PV Splittable MCAO-UI implementation
 */

import { useState } from 'react'
import type { CategorizedMCAOData } from '../../lib/types/mcao-data'

interface MCAOCategorizedDataProps {
  categorizedData: CategorizedMCAOData
  fieldCount?: number
  apn?: string
}

export function MCAOCategorizedData({ categorizedData, fieldCount, apn }: MCAOCategorizedDataProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (category: string) => {
    setOpenSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const categories = Object.entries(categorizedData || {})

  if (categories.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No categorized data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {apn && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-lg">APN: {apn}</h3>
          {fieldCount !== undefined && (
            <p className="text-sm text-gray-600 mt-1">
              {fieldCount} fields retrieved
            </p>
          )}
        </div>
      )}

      {/* Categorized Sections */}
      <div className="space-y-3">
        {categories.map(([category, fields]) => {
          const fieldEntries = Object.entries(fields || {})
          const isOpen = openSections[category]

          return (
            <div
              key={category}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleSection(category)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{category}</h4>
                  <span className="text-sm text-gray-500">
                    ({fieldEntries.length} fields)
                  </span>
                </div>
                <span className="text-gray-600 text-xl">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Category Content */}
              {isOpen && (
                <div className="p-4">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      {fieldEntries.map(([key, value]) => (
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="py-2 px-3 text-sm font-medium text-gray-700 align-top w-2/5">
                            {key}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-900 break-words">
                            {formatValue(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Format field values for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

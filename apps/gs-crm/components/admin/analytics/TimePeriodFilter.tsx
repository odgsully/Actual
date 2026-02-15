'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import type { TimePeriod, DateRange } from '@/lib/database/analytics'

interface TimePeriodFilterProps {
  value: TimePeriod
  onChange: (period: TimePeriod, customRange?: DateRange) => void
  customRange?: DateRange
}

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last Quarter' },
  { value: 'year', label: 'Last Year' },
]

export function TimePeriodFilter({ value, onChange, customRange }: TimePeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempStart, setTempStart] = useState(customRange?.start || new Date())
  const [tempEnd, setTempEnd] = useState(customRange?.end || new Date())

  const selectedLabel =
    value === 'custom' && customRange
      ? `${format(customRange.start, 'MMM d')} - ${format(customRange.end, 'MMM d, yyyy')}`
      : PERIOD_OPTIONS.find((p) => p.value === value)?.label || 'Select Period'

  const handlePeriodSelect = (period: TimePeriod) => {
    if (period === 'custom') {
      setShowDatePicker(true)
    } else {
      onChange(period)
      setIsOpen(false)
    }
  }

  const handleCustomRangeApply = () => {
    onChange('custom', { start: tempStart, end: tempEnd })
    setShowDatePicker(false)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-button flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        <span>{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 z-50 min-w-[200px] bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden">
            {!showDatePicker ? (
              <>
                {/* Period options */}
                <div className="py-2">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePeriodSelect(option.value)}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        value === option.value
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Custom option */}
                <div className="border-t border-white/10">
                  <button
                    onClick={() => handlePeriodSelect('custom')}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      value === 'custom'
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    Custom Range...
                  </button>
                </div>
              </>
            ) : (
              /* Date picker */
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-white/60 text-xs block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={format(tempStart, 'yyyy-MM-dd')}
                    onChange={(e) => setTempStart(new Date(e.target.value))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">End Date</label>
                  <input
                    type="date"
                    value={format(tempEnd, 'yyyy-MM-dd')}
                    onChange={(e) => setTempEnd(new Date(e.target.value))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCustomRangeApply}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

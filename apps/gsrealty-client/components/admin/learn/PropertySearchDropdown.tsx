'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Search, Building2, ChevronDown, X, Loader2 } from 'lucide-react'

export interface PropertyOption {
  id: string
  property_address: string
  property_type: 'buying' | 'selling'
  client_name: string
  deal_value?: number
  city?: string
  zip_code?: string
  price?: number
}

export interface PropertyFilters {
  zip?: string
  city?: string
  minPrice?: number
  maxPrice?: number
}

interface PropertySearchDropdownProps {
  value: PropertyOption | null
  onChange: (property: PropertyOption | null) => void
  placeholder?: string
  disabled?: boolean
  filters?: PropertyFilters
}

export function PropertySearchDropdown({
  value,
  onChange,
  placeholder = 'Search for a property...',
  disabled = false,
  filters = {},
}: PropertySearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch properties on mount
  useEffect(() => {
    async function fetchProperties() {
      setLoading(true)
      setError(null)
      try {
        const supabase = createClient()

        // Fetch properties with client info and deal value
        const { data, error: queryError } = await supabase
          .from('gsrealty_client_properties')
          .select(`
            id,
            property_address,
            property_type,
            city,
            zip_code,
            price,
            gsrealty_clients!inner (
              first_name,
              last_name
            ),
            gsrealty_deals (
              deal_value
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (queryError) throw queryError

        const formatted: PropertyOption[] = (data ?? []).map((p) => {
          // Handle Supabase join results - client is an object with !inner join
          const clientData = p.gsrealty_clients as unknown as { first_name?: string; last_name?: string } | null
          const dealsData = p.gsrealty_deals as unknown as Array<{ deal_value?: number }> | null

          return {
            id: p.id,
            property_address: p.property_address,
            property_type: p.property_type,
            client_name: `${clientData?.first_name || ''} ${clientData?.last_name || ''}`.trim() || 'Unknown',
            deal_value: dealsData?.[0]?.deal_value ?? undefined,
            city: p.city ?? undefined,
            zip_code: p.zip_code ?? undefined,
            price: p.price ? parseFloat(String(p.price)) : undefined,
          }
        })

        setProperties(formatted)
      } catch (err) {
        console.error('Error fetching properties:', err)
        setError('Failed to load properties')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter properties based on search query and filters prop
  const filteredProperties = properties.filter((property) => {
    // Apply search query filter
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      property.property_address.toLowerCase().includes(query) ||
      property.client_name.toLowerCase().includes(query)

    if (!matchesSearch) return false

    // Apply ZIP code filter
    if (filters.zip && property.zip_code !== filters.zip) return false

    // Apply city filter
    if (filters.city && property.city !== filters.city) return false

    // Apply min price filter
    if (filters.minPrice && property.price && property.price < filters.minPrice) return false

    // Apply max price filter
    if (filters.maxPrice && property.price && property.price > filters.maxPrice) return false

    return true
  })

  const handleSelect = (property: PropertyOption) => {
    onChange(property)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = () => {
    onChange(null)
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected value display / Search input */}
      <div
        className={cn(
          'flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-700',
          'bg-white/5 border-white/20 focus-within:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {value ? (
          <>
            <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{value.property_address}</p>
              <p className="text-white/60 text-sm truncate">
                {value.client_name} • {value.property_type === 'buying' ? 'Buyer' : 'Seller'}
              </p>
            </div>
            <button
              onClick={handleClear}
              disabled={disabled}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </>
        ) : (
          <>
            <Search className="w-5 h-5 text-white/40 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none"
            />
            <button
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-white/60 transition-transform duration-300',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
          </>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 py-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
              <span className="ml-2 text-white/60">Loading properties...</span>
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-red-400 text-sm">{error}</div>
          ) : filteredProperties.length === 0 ? (
            <div className="px-4 py-3 text-white/60 text-sm">
              {searchQuery ? 'No properties match your search' : 'No properties available'}
            </div>
          ) : (
            filteredProperties.map((property) => (
              <button
                key={property.id}
                onClick={() => handleSelect(property)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{property.property_address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/60 text-sm">{property.client_name}</span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        property.property_type === 'buying'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                      )}
                    >
                      {property.property_type === 'buying' ? 'Buyer' : 'Seller'}
                    </span>
                    {property.deal_value && (
                      <span className="text-white/40 text-sm">
                        {formatPrice(property.deal_value)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

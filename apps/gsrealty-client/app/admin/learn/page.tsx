'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  MapPin,
  Building2,
  DollarSign,
  Search,
  ChevronDown,
  X,
  Loader2,
  GraduationCap,
} from 'lucide-react'

interface FilterState {
  zipCode: string
  city: string
  propertyId: string
  minPrice: string
  maxPrice: string
}

interface PropertyOption {
  id: string
  property_address: string
  city?: string
  zip_code?: string
}

export default function LearnLandingPage() {
  const router = useRouter()

  const [filters, setFilters] = useState<FilterState>({
    zipCode: '',
    city: '',
    propertyId: '',
    minPrice: '',
    maxPrice: '',
  })

  // Data for dropdowns
  const [zipCodes, setZipCodes] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [filteredProperties, setFilteredProperties] = useState<PropertyOption[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [zipOpen, setZipOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [propertyOpen, setPropertyOpen] = useState(false)
  const [propertySearch, setPropertySearch] = useState('')

  // Fetch distinct ZIP codes, cities, and properties
  useEffect(() => {
    async function fetchFilterData() {
      setLoading(true)
      try {
        const supabase = createClient()

        // Fetch distinct ZIP codes
        const { data: zipData } = await supabase
          .from('gsrealty_client_properties')
          .select('zip_code')
          .eq('status', 'active')
          .not('zip_code', 'is', null)

        const uniqueZips = Array.from(new Set(zipData?.map(p => p.zip_code).filter(Boolean) as string[]))
        setZipCodes(uniqueZips.sort())

        // Fetch distinct cities
        const { data: cityData } = await supabase
          .from('gsrealty_client_properties')
          .select('city')
          .eq('status', 'active')
          .not('city', 'is', null)

        const uniqueCities = Array.from(new Set(cityData?.map(p => p.city).filter(Boolean) as string[]))
        setCities(uniqueCities.sort())

        // Fetch all properties for property dropdown
        const { data: propertyData } = await supabase
          .from('gsrealty_client_properties')
          .select('id, property_address, city, zip_code')
          .eq('status', 'active')
          .order('property_address')

        setProperties(propertyData || [])
        setFilteredProperties(propertyData || [])
      } catch (err) {
        console.error('Error fetching filter data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFilterData()
  }, [])

  // Filter properties based on selected ZIP and city
  useEffect(() => {
    let filtered = [...properties]

    if (filters.zipCode) {
      filtered = filtered.filter(p => p.zip_code === filters.zipCode)
    }
    if (filters.city) {
      filtered = filtered.filter(p => p.city === filters.city)
    }
    if (propertySearch) {
      const search = propertySearch.toLowerCase()
      filtered = filtered.filter(p =>
        p.property_address?.toLowerCase().includes(search)
      )
    }

    setFilteredProperties(filtered)
  }, [properties, filters.zipCode, filters.city, propertySearch])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))

    // Clear property selection if ZIP or city changes
    if (key === 'zipCode' || key === 'city') {
      setFilters(prev => ({ ...prev, [key]: value, propertyId: '' }))
    }
  }

  const clearFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: '' }))
  }

  const handleGoToReDuolingo = () => {
    // Build URL params from filters
    const params = new URLSearchParams()
    if (filters.zipCode) params.set('zip', filters.zipCode)
    if (filters.city) params.set('city', filters.city)
    if (filters.propertyId) params.set('propertyId', filters.propertyId)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)

    const queryString = params.toString()
    router.push(`/admin/learn/reduolingo${queryString ? `?${queryString}` : ''}`)
  }

  const selectedProperty = properties.find(p => p.id === filters.propertyId)

  const activeFiltersCount = [
    filters.zipCode,
    filters.city,
    filters.propertyId,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Learn</h1>
              <p className="text-white/60">Set your preferences and start learning</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters Section */}
      <Card className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Search className="w-5 h-5 text-white/60" />
          <h2 className="text-lg font-semibold text-white">Filter Properties</h2>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
              {activeFiltersCount} active
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ZIP Code Filter */}
            <div className="relative">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                ZIP Code
              </label>
              <button
                onClick={() => setZipOpen(!zipOpen)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-left flex items-center justify-between hover:border-white/40 transition-all duration-300"
              >
                <span className={filters.zipCode ? 'text-white' : 'text-white/40'}>
                  {filters.zipCode || 'Select ZIP code'}
                </span>
                <div className="flex items-center gap-2">
                  {filters.zipCode && (
                    <X
                      className="w-4 h-4 text-white/40 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); clearFilter('zipCode'); }}
                    />
                  )}
                  <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', zipOpen && 'rotate-180')} />
                </div>
              </button>
              {zipOpen && (
                <div className="absolute z-20 mt-2 w-full bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-auto">
                  {zipCodes.length === 0 ? (
                    <div className="px-4 py-3 text-white/40 text-sm">No ZIP codes found</div>
                  ) : (
                    zipCodes.map(zip => (
                      <button
                        key={zip}
                        onClick={() => { handleFilterChange('zipCode', zip); setZipOpen(false); }}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-white/10 transition-colors',
                          filters.zipCode === zip ? 'bg-purple-500/20 text-purple-400' : 'text-white'
                        )}
                      >
                        {zip}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* City Filter */}
            <div className="relative">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                City
              </label>
              <button
                onClick={() => setCityOpen(!cityOpen)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-left flex items-center justify-between hover:border-white/40 transition-all duration-300"
              >
                <span className={filters.city ? 'text-white' : 'text-white/40'}>
                  {filters.city || 'Select city'}
                </span>
                <div className="flex items-center gap-2">
                  {filters.city && (
                    <X
                      className="w-4 h-4 text-white/40 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); clearFilter('city'); }}
                    />
                  )}
                  <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', cityOpen && 'rotate-180')} />
                </div>
              </button>
              {cityOpen && (
                <div className="absolute z-20 mt-2 w-full bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-auto">
                  {cities.length === 0 ? (
                    <div className="px-4 py-3 text-white/40 text-sm">No cities found</div>
                  ) : (
                    cities.map(city => (
                      <button
                        key={city}
                        onClick={() => { handleFilterChange('city', city); setCityOpen(false); }}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-white/10 transition-colors',
                          filters.city === city ? 'bg-purple-500/20 text-purple-400' : 'text-white'
                        )}
                      >
                        {city}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Property Filter */}
            <div className="relative">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Property
              </label>
              <button
                onClick={() => setPropertyOpen(!propertyOpen)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-left flex items-center justify-between hover:border-white/40 transition-all duration-300"
              >
                <span className={selectedProperty ? 'text-white truncate' : 'text-white/40'}>
                  {selectedProperty?.property_address || 'Select property'}
                </span>
                <div className="flex items-center gap-2">
                  {filters.propertyId && (
                    <X
                      className="w-4 h-4 text-white/40 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); clearFilter('propertyId'); }}
                    />
                  )}
                  <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', propertyOpen && 'rotate-180')} />
                </div>
              </button>
              {propertyOpen && (
                <div className="absolute z-20 mt-2 w-full bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl max-h-72 overflow-hidden">
                  <div className="p-2 border-b border-white/10">
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="max-h-52 overflow-auto">
                    {filteredProperties.length === 0 ? (
                      <div className="px-4 py-3 text-white/40 text-sm">No properties found</div>
                    ) : (
                      filteredProperties.map(property => (
                        <button
                          key={property.id}
                          onClick={() => { handleFilterChange('propertyId', property.id); setPropertyOpen(false); setPropertySearch(''); }}
                          className={cn(
                            'w-full px-4 py-3 text-left hover:bg-white/10 transition-colors',
                            filters.propertyId === property.id ? 'bg-purple-500/20 text-purple-400' : 'text-white'
                          )}
                        >
                          <div className="truncate">{property.property_address}</div>
                          {(property.city || property.zip_code) && (
                            <div className="text-xs text-white/40 mt-0.5">
                              {[property.city, property.zip_code].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price Range - Min */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Min Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Price Range - Max */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Max Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  placeholder="No limit"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ReDuolingo Button */}
      <Card className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ready to Learn?</h2>
              <p className="text-white/60">
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied - quizzes will be focused on matching properties`
                  : 'Start with general quizzes or generate property-specific ones'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleGoToReDuolingo}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-bold rounded-xl transition-all duration-700 hover:scale-[1.02]"
          >
            <GraduationCap className="w-5 h-5 mr-2" />
            ReDuolingo
          </Button>
        </div>
      </Card>
    </div>
  )
}

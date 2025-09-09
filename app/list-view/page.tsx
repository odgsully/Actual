'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { MapProvider, useMapContext } from '@/contexts/MapContext'
import PropertyMap from '@/components/map/PropertyMap'
import MapFilterDropdown from '@/components/map/MapFilterDropdown'
import SignInModal from '@/components/auth/SignInModal'
import DemoBanner from '@/components/DemoBanner'
import { createClient } from '@/lib/supabase/client'

const sampleProperties = [
  {
    id: '1',
    address: "7525 E Gainey Ranch Rd #145",
    price: "$850,000",
    beds: 3,
    baths: 2.5,
    sqft: 2450,
    image: "/api/placeholder/400/300",
    avgRanking: 7.5,
    voted: 2,
    favorite: true,
    latitude: 33.5698,
    longitude: -111.9192,
    list_price: 850000
  },
  {
    id: '2',
    address: "3120 N 38th St",
    price: "$1,200,000",
    beds: 4,
    baths: 3,
    sqft: 3200,
    image: "/api/placeholder/400/300",
    avgRanking: 8.2,
    voted: 1,
    favorite: false,
    imported: "Zillow",
    latitude: 33.4895,
    longitude: -112.0010,
    list_price: 1200000
  },
  {
    id: '3',
    address: "5420 E Lincoln Dr",
    price: "$2,500,000",
    beds: 5,
    baths: 4.5,
    sqft: 4500,
    image: "/api/placeholder/400/300",
    avgRanking: 6.8,
    voted: 2,
    favorite: false,
    latitude: 33.5322,
    longitude: -111.9684,
    list_price: 2500000
  },
  {
    id: '4',
    address: "9820 N Central Ave",
    price: "$650,000",
    beds: 2,
    baths: 2,
    sqft: 1800,
    image: "/api/placeholder/400/300",
    avgRanking: 7.0,
    voted: 1,
    favorite: true,
    latitude: 33.5807,
    longitude: -112.0738,
    list_price: 650000
  },
  {
    id: '5',
    address: "4502 E Camelback Rd",
    price: "$975,000",
    beds: 3,
    baths: 2,
    sqft: 2100,
    image: "/api/placeholder/400/300",
    avgRanking: 7.3,
    voted: 0,
    favorite: false,
    latitude: 33.5097,
    longitude: -111.9867,
    list_price: 975000
  },
  {
    id: '6',
    address: "2211 E Highland Ave",
    price: "$1,100,000",
    beds: 4,
    baths: 3,
    sqft: 2800,
    image: "/api/placeholder/400/300",
    avgRanking: 8.0,
    voted: 1,
    favorite: true,
    latitude: 33.5062,
    longitude: -112.0346,
    list_price: 1100000
  },
  {
    id: '7',
    address: "6900 E Princess Dr",
    price: "$3,200,000",
    beds: 6,
    baths: 5,
    sqft: 5200,
    image: "/api/placeholder/400/300",
    avgRanking: 6.5,
    voted: 0,
    favorite: false,
    latitude: 33.5859,
    longitude: -111.9374,
    list_price: 3200000
  },
  {
    id: '8',
    address: "1515 N 7th St",
    price: "$550,000",
    beds: 2,
    baths: 1.5,
    sqft: 1600,
    image: "/api/placeholder/400/300",
    avgRanking: 7.8,
    voted: 2,
    favorite: false,
    latitude: 33.4649,
    longitude: -112.0633,
    list_price: 550000
  }
]

function ListViewContent() {
  const { user, loading, showSignIn, setShowSignIn } = useRequireAuth()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('ranking')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [showMap, setShowMap] = useState(false)
  const [loadingProperties, setLoadingProperties] = useState(true)
  
  const {
    searchAreas,
    filteredProperties,
    isLoading: mapLoading,
    clearAllAreas,
    deleteSearchArea,
    toggleAreaActive
  } = useMapContext()

  // Apply map filtering to properties if any areas are drawn
  const [displayProperties, setDisplayProperties] = useState<any[]>([])
  
  // Fetch properties from database
  useEffect(() => {
    async function fetchProperties() {
      setLoadingProperties(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (!error && data && data.length > 0) {
        // Transform database properties to match component format
        const transformedProperties = data.map(prop => ({
          id: prop.id,
          address: prop.address,
          price: `$${prop.list_price?.toLocaleString() || '0'}`,
          beds: prop.bedrooms || 0,
          baths: prop.bathrooms || 0,
          sqft: prop.square_footage || 0,
          image: '/api/placeholder/400/300',
          avgRanking: Math.round((Math.random() * 3 + 6) * 10) / 10, // Random 6.0-9.0 for demo
          voted: 0,
          favorite: false,
          latitude: prop.latitude || 33.5,
          longitude: prop.longitude || -111.9,
          list_price: prop.list_price || 0,
          city: prop.city,
          state: prop.state,
          zip_code: prop.zip_code,
          property_type: prop.property_type,
          year_built: prop.year_built,
          has_pool: prop.has_pool,
          garage_spaces: prop.garage_spaces
        }))
        
        setProperties(transformedProperties)
        setDisplayProperties(transformedProperties)
      } else {
        // Fallback to sample properties if no data or error
        console.log('No properties found or error, using samples:', error)
        setProperties(sampleProperties)
        setDisplayProperties(sampleProperties)
      }
      
      setLoadingProperties(false)
    }
    
    fetchProperties()
  }, [])

  useEffect(() => {
    if (searchAreas.length > 0 && filteredProperties.length > 0) {
      // Filter properties based on map areas
      const mapFiltered = properties.filter(prop =>
        filteredProperties.some(fp => fp.property_id === prop.id)
      )
      setDisplayProperties(mapFiltered)
    } else {
      setDisplayProperties(properties)
    }
  }, [filteredProperties, searchAreas, properties])

  if (loading || loadingProperties) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const toggleFavorite = (id: string) => {
    setProperties(prev => 
      prev.map(property => 
        property.id === id 
          ? { ...property, favorite: !property.favorite }
          : property
      )
    )
  }

  const finalFilteredProperties = filterFavorites 
    ? displayProperties.filter(p => p.favorite)
    : displayProperties
  
  const handleAreaDrawn = (area: any) => {
    console.log('New area drawn in list view:', area)
    setShowMap(true) // Keep map open after drawing
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative transition-colors">
      {/* Background Assets */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url(/assets/noise.png)`,
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed'
          }}
        />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(/assets/grid.svg)`,
            backgroundSize: '300px 300px',
            backgroundRepeat: 'repeat'
          }}
        />
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(/assets/gradient.svg)`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
      </div>
      {/* Navigation */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b dark:border-gray-700 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/assets/logo.png" alt="Wabbit Logo" className="h-8 w-auto" />
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Home
              </Link>
            </div>
            <div className="flex space-x-6">
              <Link href="/rank-feed" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Rank Feed
              </Link>
              <Link href="/list-view" className="font-semibold text-blue-600 border-b-2 border-blue-600 pb-1">
                List View
              </Link>
              <Link href="/settings" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b dark:border-gray-700 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <MapFilterDropdown 
                  showMap={showMap}
                  onToggleMap={() => setShowMap(!showMap)}
                />
                <button
                  onClick={() => setFilterFavorites(!filterFavorites)}
                  className={`px-4 py-2 rounded-lg ${
                    filterFavorites 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  ⭐ Favorites Only
                </button>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="ranking">Sort by Ranking</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section (Collapsible) */}
      {showMap && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b dark:border-gray-700 relative z-10">
          <div className="container mx-auto px-4 py-4">
            <PropertyMap
              properties={properties}
              onAreaDrawn={handleAreaDrawn}
              height="400px"
            />
          </div>
        </div>
      )}

      {/* Property List */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {finalFilteredProperties.map(property => (
              <div key={property.id} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 transform">
                <div className="relative">
                  <div className="bg-gray-200 h-48 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <button
                    onClick={() => toggleFavorite(property.id)}
                    className="absolute top-2 right-2 text-2xl hover:scale-110 transition-transform"
                  >
                    <span className={property.favorite ? 'text-yellow-500' : 'text-gray-300'}>
                      ⭐
                    </span>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{property.address}</h3>
                  <p className="text-2xl font-bold text-green-600 mb-2">{property.price}</p>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span>{property.beds} beds</span>
                    <span>{property.baths} baths</span>
                    <span>{property.sqft} sqft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Avg:</span>
                      <span className="text-lg font-bold text-blue-600">{property.avgRanking}</span>
                    </div>
                    <Link 
                      href="/rank-feed"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {finalFilteredProperties.map(property => (
              <div key={property.id} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-6 hover:shadow-2xl hover:scale-102 transition-all duration-300 transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="bg-gray-200 w-32 h-24 rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">{property.address}</h3>
                      <p className="text-2xl font-bold text-green-600 mb-2">{property.price}</p>
                      <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{property.beds} beds</span>
                        <span>{property.baths} baths</span>
                        <span>{property.sqft} sqft</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleFavorite(property.id)}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      <span className={property.favorite ? 'text-yellow-500' : 'text-gray-300'}>
                        ⭐
                      </span>
                    </button>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg Score</p>
                      <p className="text-2xl font-bold text-blue-600">{property.avgRanking}</p>
                    </div>
                    <Link 
                      href="/rank-feed"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demo Banner */}
      <DemoBanner />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={() => setShowSignIn(false)}
      />
    </div>
  )
}

export default function ListViewPage() {
  return (
    <MapProvider>
      <ListViewContent />
    </MapProvider>
  )
}
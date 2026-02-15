'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { MapProvider, useMapContext } from '@/contexts/MapContext'
import PropertyMap from '@/components/map/PropertyMap'
import SignInModal from '@/components/auth/SignInModal'
import DemoBanner from '@/components/DemoBanner'

// Sample properties for testing (Phoenix area)
const sampleProperties = [
  {
    id: '1',
    address: '7525 E Gainey Ranch Rd #145',
    latitude: 33.5698,
    longitude: -111.9192,
    list_price: 850000
  },
  {
    id: '2',
    address: '3120 N 38th St',
    latitude: 33.4895,
    longitude: -112.0010,
    list_price: 1200000
  },
  {
    id: '3',
    address: '5420 E Lincoln Dr',
    latitude: 33.5322,
    longitude: -111.9684,
    list_price: 2500000
  },
  {
    id: '4',
    address: '9820 N Central Ave',
    latitude: 33.5807,
    longitude: -112.0738,
    list_price: 650000
  },
  {
    id: '5',
    address: '4502 E Camelback Rd',
    latitude: 33.5097,
    longitude: -111.9867,
    list_price: 975000
  },
  {
    id: '6',
    address: '2211 E Highland Ave',
    latitude: 33.5062,
    longitude: -112.0346,
    list_price: 1100000
  },
  {
    id: '7',
    address: '6900 E Princess Dr',
    latitude: 33.5859,
    longitude: -111.9374,
    list_price: 3200000
  },
  {
    id: '8',
    address: '1515 N 7th St',
    latitude: 33.4649,
    longitude: -112.0633,
    list_price: 550000
  }
]

function MapTestContent() {
  const {
    searchAreas,
    filteredProperties,
    isLoading,
    clearAllAreas,
    deleteSearchArea,
    toggleAreaActive
  } = useMapContext()

  const [selectedProperties, setSelectedProperties] = useState<any[]>([])

  // Update selected properties when filtered properties change
  useEffect(() => {
    if (filteredProperties.length > 0) {
      const filtered = sampleProperties.filter(prop =>
        filteredProperties.some(fp => fp.property_id === prop.id)
      )
      setSelectedProperties(filtered)
    } else if (searchAreas.length === 0) {
      setSelectedProperties(sampleProperties)
    }
  }, [filteredProperties, searchAreas])

  const handleAreaDrawn = (area: any) => {
    console.log('New area drawn:', area)
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img src="/assets/logo.png" alt="Wabbit Logo" className="h-8 w-auto mr-4" />
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Map Drawing Test
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Draw Search Areas
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Use the drawing tools to create search areas. Properties will be automatically filtered.
              </p>
              
              <PropertyMap
                properties={sampleProperties}
                onAreaDrawn={handleAreaDrawn}
                height="500px"
              />

              {/* Property Count */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Showing <strong>{selectedProperties.length}</strong> of {sampleProperties.length} properties
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search Areas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Search Areas
                </h3>
                {searchAreas.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all search areas?')) {
                        clearAllAreas()
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : searchAreas.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No search areas drawn yet. Use the drawing tools on the map.
                </p>
              ) : (
                <div className="space-y-2">
                  {searchAreas.map(area => (
                    <div
                      key={area.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                            {area.area_name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Type: {area.area_type}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Properties: {area.property_count || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Mode: {area.is_inclusion ? 'Include' : 'Exclude'}
                          </p>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: area.color }}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => toggleAreaActive(area.id)}
                          className={`text-xs px-2 py-1 rounded ${
                            area.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {area.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${area.area_name}"?`)) {
                              deleteSearchArea(area.id)
                            }
                          }}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                How to Use
              </h3>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex">
                  <span className="font-bold mr-2">1.</span>
                  Click the drawing tools at the top of the map
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">2.</span>
                  Choose Rectangle, Polygon, or Circle
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">3.</span>
                  Draw your search area on the map
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">4.</span>
                  Name your area and choose Include/Exclude
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">5.</span>
                  Properties will be filtered automatically
                </li>
              </ol>
            </div>

            {/* Selected Properties */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Filtered Properties
              </h3>
              {selectedProperties.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No properties in selected areas
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProperties.map(prop => (
                    <div
                      key={prop.id}
                      className="p-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {prop.address}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ${prop.list_price.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
            ⚠️ Setup Required
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            To use the map features, you need to:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>Enable PostGIS in your Supabase project (Database → Extensions)</li>
            <li>Enable PostGIS spatial features via <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">apps/wabbit-re/migrations/001_enable_postgis_spatial_features.sql</code></li>
            <li>Add Google Maps API key to .env.local: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key</code></li>
          </ol>
        </div>
      </div>

      <DemoBanner />
    </div>
  )
}

export default function MapTestPage() {
  const { user, loading, showSignIn, setShowSignIn } = useRequireAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <MapProvider>
        <MapTestContent />
      </MapProvider>
      
      {showSignIn && (
        <SignInModal
          isOpen={showSignIn}
          onClose={() => setShowSignIn(false)}
        />
      )}
    </>
  )
}
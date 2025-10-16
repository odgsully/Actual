'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import SignInModal from '@/components/auth/SignInModal'
import DemoBanner from '@/components/DemoBanner'
import PropertyDetailModal from '@/components/PropertyDetailModal'
import { createClient } from '@/lib/supabase/client'

// Removed hardcoded sample properties - now fetching from database

function ListViewContent() {
  const { user, loading, showSignIn, setShowSignIn } = useRequireAuth()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('ranking')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [showPropertyModal, setShowPropertyModal] = useState(false)

  // Apply map filtering to properties if any areas are drawn
  const [displayProperties, setDisplayProperties] = useState<any[]>([])
  
  // Fetch properties from database
  useEffect(() => {
    async function fetchProperties() {
      setLoadingProperties(true)
      const supabase = createClient()
      
      // Check if demo user to fetch demo properties
      const isDemoUser = user?.email === 'support@wabbit-rank.ai'
      
      // First get properties
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
      
      // For demo user, get properties linked to them
      if (isDemoUser && user) {
        // Get properties linked to demo user
        const { data: userProps } = await supabase
          .from('user_properties')
          .select('property_id')
          .eq('user_id', user.id)
        
        if (userProps && userProps.length > 0) {
          const linkedIds = userProps.map(up => up.property_id)
          query = query.in('id', linkedIds)
        }
      }
      
      const { data, error } = await query
        .order('list_price', { ascending: false })
        .limit(20)
      
      let transformedProperties: any[] = []
      
      if (!error && data && data.length > 0) {
        // Fetch images for all properties
        const propertyIds = data.map(p => p.id)
        const { data: images } = await supabase
          .from('property_images')
          .select('property_id, image_url')
          .in('property_id', propertyIds)
          .eq('image_type', 'primary')
          .order('display_order', { ascending: true })
        
        // Create a map of property ID to image URL
        const imageMap: Record<string, string> = {}
        if (images) {
          images.forEach(img => {
            if (!imageMap[img.property_id]) {
              imageMap[img.property_id] = img.image_url
            }
          })
        }
        
        // Transform database properties to match component format
        transformedProperties = data.map(prop => ({
          id: prop.id,
          address: prop.address,
          price: `$${prop.list_price?.toLocaleString() || '0'}`,
          beds: prop.bedrooms || 0,
          baths: prop.bathrooms || 0,
          sqft: prop.square_footage || 0,
          image: imageMap[prop.id] || prop.primary_image_url || '/api/placeholder/400/300',
          avgRanking: Math.round((Math.random() * 3 + 6) * 10) / 10, // Random 6.0-9.0 for demo
          voted: 0,
          favorite: false, // Will be updated below
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
      } else {
        // No fallback - show empty state or loading
        console.log('No properties found:', error)
        transformedProperties = []
      }
      
      // Load user favorites if authenticated
      if (user) {
        const propertyIds = transformedProperties.map(p => p.id)
        const { data: favorites } = await supabase
          .from('user_properties')
          .select('property_id')
          .eq('user_id', user.id)
          .eq('is_favorite', true)
          .in('property_id', propertyIds)
        
        if (favorites) {
          const favoriteIds = new Set(favorites.map(f => f.property_id))
          transformedProperties = transformedProperties.map(prop => ({
            ...prop,
            favorite: favoriteIds.has(prop.id)
          }))
        }
      }
      
      setProperties(transformedProperties)
      setDisplayProperties(transformedProperties)
      setLoadingProperties(false)
    }
    
    fetchProperties()
  }, [user])

  useEffect(() => {
    setDisplayProperties(properties)
  }, [properties])

  if (loading || loadingProperties) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const toggleFavorite = async (id: string) => {
    // Find the property to get its current favorite status
    const property = properties.find(p => p.id === id)
    if (!property) return
    
    const newFavoriteStatus = !property.favorite
    
    // Optimistically update UI
    setProperties(prev => 
      prev.map(prop => 
        prop.id === id 
          ? { ...prop, favorite: newFavoriteStatus }
          : prop
      )
    )
    
    // Persist to Supabase if user is authenticated
    if (user) {
      const supabase = createClient()
      
      try {
        // Check if user_property relation exists
        const { data: existing } = await supabase
          .from('user_properties')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', id)
          .single()
        
        if (existing) {
          // Update existing record
          const { error } = await supabase
            .from('user_properties')
            .update({ is_favorite: newFavoriteStatus })
            .eq('user_id', user.id)
            .eq('property_id', id)
          
          if (error) {
            console.error('Error updating favorite:', error)
            // Revert on error
            setProperties(prev => 
              prev.map(prop => 
                prop.id === id 
                  ? { ...prop, favorite: !newFavoriteStatus }
                  : prop
              )
            )
          }
        } else {
          // Create new record
          const { error } = await supabase
            .from('user_properties')
            .insert({
              user_id: user.id,
              property_id: id,
              is_favorite: newFavoriteStatus,
              source: 'manual'
            })
          
          if (error) {
            console.error('Error creating favorite:', error)
            // Revert on error
            setProperties(prev => 
              prev.map(prop => 
                prop.id === id 
                  ? { ...prop, favorite: !newFavoriteStatus }
                  : prop
              )
            )
          }
        }
      } catch (err) {
        console.error('Error toggling favorite:', err)
      }
    }
  }

  const finalFilteredProperties = filterFavorites 
    ? displayProperties.filter(p => p.favorite)
    : displayProperties

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
                <button
                  onClick={() => setFilterFavorites(!filterFavorites)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    filterFavorites 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{filterFavorites ? '⭐' : '☆'}</span>
                  <span>Favorites Only</span>
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

      {/* Property List */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {finalFilteredProperties.map(property => (
              <div 
                key={property.id} 
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 transform cursor-pointer"
                onClick={() => {
                  setSelectedProperty(property)
                  setShowPropertyModal(true)
                }}
              >
                <div className="relative">
                  {property.image && property.image !== '/api/placeholder/400/300' ? (
                    <img 
                      src={property.image} 
                      alt={property.address}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/400/300';
                      }}
                    />
                  ) : (
                    <div className="bg-gray-200 h-48 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(property.id)
                    }}
                    className="absolute top-2 right-2 text-2xl hover:scale-110 transition-transform"
                  >
                    {property.favorite ? (
                      <span className="text-yellow-500">⭐</span>
                    ) : (
                      <span className="text-gray-400">☆</span>
                    )}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProperty(property)
                        setShowPropertyModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </button>
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
                    {property.image && property.image !== '/api/placeholder/400/300' ? (
                      <img 
                        src={property.image} 
                        alt={property.address}
                        className="w-32 h-24 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/400/300';
                        }}
                      />
                    ) : (
                      <div className="bg-gray-200 w-32 h-24 rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
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
                      {property.favorite ? (
                        <span className="text-yellow-500">⭐</span>
                      ) : (
                        <span className="text-gray-400">☆</span>
                      )}
                    </button>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg Score</p>
                      <p className="text-2xl font-bold text-blue-600">{property.avgRanking}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProperty(property)
                        setShowPropertyModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Details
                    </button>
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
      
      {/* Property Detail Modal */}
      <PropertyDetailModal
        isOpen={showPropertyModal}
        onClose={() => {
          setShowPropertyModal(false)
          setSelectedProperty(null)
        }}
        property={selectedProperty}
      />
    </div>
  )
}

export default function ListViewPage() {
  return <ListViewContent />
}
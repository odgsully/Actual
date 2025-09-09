'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { MapProvider, useMapContext } from '@/contexts/MapContext'
import InteractiveLocationMap from '@/components/map/InteractiveLocationMap'
import PropertyMap from '@/components/map/PropertyMap'
import MapFilterDropdown from '@/components/map/MapFilterDropdown'
import SchoolsTable from '@/components/map/SchoolsTable'
import EntertainmentTable from '@/components/map/EntertainmentTable'
import GroceriesTable from '@/components/map/GroceriesTable'
import { getSchoolsNearProperty, getEntertainmentDistricts, getGroceryStores } from '@/lib/map/location-data-service'
import SignInModal from '@/components/auth/SignInModal'
import DemoBanner from '@/components/DemoBanner'

const sampleProperty = {
  id: '1',
  address: "7525 E Gainey Ranch Rd #145",
  listPrice: "$850,000",
  list_price: 850000,
  city: "Scottsdale",
  zip: "85258",
  schools: "Cochise Elementary, Cocopah Middle, Chaparral High",
  hoa: "Yes - $450/month",
  renoYear: "2019",
  buildYear: "1998",
  jurisdiction: "Scottsdale",
  isFavorite: false,
  latitude: 33.5698,
  longitude: -111.9192
}


function RankFeedContent() {
  const { user, loading, showSignIn, setShowSignIn } = useRequireAuth()
  const [showMapFilter, setShowMapFilter] = useState(false)
  const [rankings, setRankings] = useState({
    priceValue: '',
    location: '',
    layout: '',
    turnkey: ''
  })
  const [comments, setComments] = useState({
    priceValue: '',
    location: '',
    layout: '',
    turnkey: ''
  })
  const [isFavorite, setIsFavorite] = useState(sampleProperty.isFavorite)
  const [showLocationTables, setShowLocationTables] = useState(false)
  
  // Fetch location data
  const [locationData, setLocationData] = useState<any>({
    schools: [],
    entertainment: [],
    groceries: []
  })
  
  useEffect(() => {
    // Load location data based on property
    const schools = getSchoolsNearProperty(sampleProperty.latitude, sampleProperty.longitude)
    const entertainment = getEntertainmentDistricts(sampleProperty.latitude, sampleProperty.longitude)
    const groceries = getGroceryStores(sampleProperty.latitude, sampleProperty.longitude)
    
    setLocationData({ schools, entertainment, groceries })
  }, [sampleProperty])
  
  // Get commute addresses from form data (in real app, would come from user preferences)
  const commuteAddress1 = { address: 'Downtown Phoenix', maxMinutes: 30 }
  const commuteAddress2 = { address: 'Scottsdale Airpark', maxMinutes: 20 }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const rankingOrder = ['priceValue', 'location', 'layout', 'turnkey']

  const handleRankingChange = (metric: string, value: string) => {
    const numValue = parseInt(value) || ''
    if (numValue === '' || (numValue >= 1 && numValue <= 10)) {
      setRankings(prev => ({ ...prev, [metric]: value }))
    }
  }

  const handleCommentChange = (metric: string, value: string) => {
    setComments(prev => ({ ...prev, [metric]: value }))
  }

  const handleKeyPress = (e: React.KeyboardEvent, currentMetric: string, isComment: boolean = false) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const currentIndex = rankingOrder.indexOf(currentMetric)
      
      if (!isComment) {
        // Move to comment field for same metric
        const commentField = document.getElementById(`comment-${currentMetric}`) as HTMLTextAreaElement
        if (commentField) {
          commentField.focus()
        }
      } else {
        // Move to next metric's ranking field
        const nextIndex = (currentIndex + 1) % rankingOrder.length
        const nextMetric = rankingOrder[nextIndex]
        const nextField = document.getElementById(`ranking-${nextMetric}`) as HTMLInputElement
        if (nextField) {
          nextField.focus()
        }
      }
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
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
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/assets/logo.png" alt="Wabbit Logo" className="h-8 w-auto" />
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Home
              </Link>
            </div>
            <div className="flex space-x-6">
              <Link href="/rank-feed" className="font-semibold text-blue-600 border-b-2 border-blue-600 pb-1">
                Rank Feed
              </Link>
              <Link href="/list-view" className="text-gray-600 hover:text-gray-900">
                List View
              </Link>
              <Link href="/settings" className="text-gray-600 hover:text-gray-900">
                More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Map Filter Bar */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b relative z-10">
        <div className="container mx-auto px-4 py-3">
          <MapFilterDropdown 
            showMap={showMapFilter}
            onToggleMap={() => setShowMapFilter(!showMapFilter)}
          />
        </div>
      </div>

      {/* Map Filter Section (Collapsible) */}
      {showMapFilter && (
        <div className="bg-white/90 backdrop-blur-sm border-b shadow-md relative z-10">
          <div className="container mx-auto px-4 py-4">
            <PropertyMap
              properties={[sampleProperty]}
              onAreaDrawn={(area) => console.log('Area drawn:', area)}
              height="400px"
            />
          </div>
        </div>
      )}

      {/* Main Content - 4 Tile Layout */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Property Info Tile */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Property Information</h2>
              <button
                onClick={toggleFavorite}
                className={`text-2xl transition-colors duration-200 ${
                  isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                {isFavorite ? '⭐' : '☆'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                <p className="font-semibold text-gray-900 dark:text-white">{sampleProperty.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">List Price</p>
                  <p className="font-semibold text-green-600">{sampleProperty.listPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{sampleProperty.city}, {sampleProperty.zip}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Schools</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{sampleProperty.schools}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">HOA</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{sampleProperty.hoa}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Built/Renovated</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{sampleProperty.buildYear} / {sampleProperty.renoYear}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking Tile */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Property Ranking</h2>
            <div className="space-y-6">
              {Object.entries({
                priceValue: 'Price:Value',
                location: 'Location',
                layout: 'Layout',
                turnkey: 'Turnkey'
              }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id={`ranking-${key}`}
                        type="number"
                        min="1"
                        max="10"
                        value={rankings[key as keyof typeof rankings]}
                        onChange={(e) => handleRankingChange(key, e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, key, false)}
                        placeholder="1-10"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">/ 10</span>
                    </div>
                    <textarea
                      id={`comment-${key}`}
                      value={comments[key as keyof typeof comments]}
                      onChange={(e) => handleCommentChange(key, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, key, true)}
                      placeholder={`Why did you rate ${label.toLowerCase()} this way?`}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Google Interactive Map Tile */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Interactive Location Map</h2>
              <button
                onClick={() => setShowLocationTables(!showLocationTables)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                {showLocationTables ? 'Hide' : 'Show'} Details
                <svg className={`w-4 h-4 ml-1 transform transition-transform ${showLocationTables ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <InteractiveLocationMap
              property={sampleProperty}
              commuteAddress1={commuteAddress1}
              commuteAddress2={commuteAddress2}
              schools={locationData.schools}
              entertainment={locationData.entertainment}
              groceries={locationData.groceries}
              height="300px"
            />
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span className="text-gray-700 dark:text-gray-300">Property Location</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                <span className="text-gray-700 dark:text-gray-300">Commute Destinations</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                <span className="text-gray-700 dark:text-gray-300">Schools</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                <span className="text-gray-700 dark:text-gray-300">Entertainment</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-gray-700 dark:text-gray-300">Groceries</span>
              </div>
            </div>
          </div>

          {/* Property Image Carousel */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Property Images</h2>
            <div className="relative">
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex justify-between mt-4">
                <button className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Previous
                </button>
                <div className="flex space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                </div>
                <button className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Location Intelligence Tables (Collapsible) */}
        {showLocationTables && (
          <div className="mt-6 space-y-6">
            <SchoolsTable schools={locationData.schools} />
            <EntertainmentTable districts={locationData.entertainment} />
            <GroceriesTable stores={locationData.groceries} />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
            Skip Property
          </button>
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Submit Ranking & Next
          </button>
        </div>
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

export default function RankFeedPage() {
  return (
    <MapProvider>
      <RankFeedContent />
    </MapProvider>
  )
}
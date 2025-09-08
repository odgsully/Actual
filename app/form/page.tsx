'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { MapProvider, useMapContext } from '@/contexts/MapContext'
import PropertyMap from '@/components/map/PropertyMap'
import DemoBanner from '@/components/DemoBanner'
import ResponseSummary from '@/components/form/ResponseSummary'
import AuthLoadingScreen from '@/components/AuthLoadingScreen'

interface FormField {
  name: string
  label: string
  type: string
  placeholder?: string
  options?: string[]
  min?: string
  max?: string
  required?: boolean
  isCurrency?: boolean
}

interface FormPage {
  title: string
  description: string
  fields: FormField[]
  showSummary?: boolean
}

const formPages: FormPage[] = [
  {
    title: "Search Your Profile",
    description: "Let's see if we already have your information",
    fields: [
      { name: "searchName", label: "Enter your name", type: "text", placeholder: "Start typing your name..." }
    ]
  },
  {
    title: "Property Preferences",
    description: "What type of property are you looking for?",
    fields: [
      { name: "propertyType", label: "Interest in anything outside of Single Family home?", type: "select", options: ["Single Family", "Condo", "Townhouse", "Multi-Family"] }
    ]
  },
  {
    title: "Size & Budget",
    description: "Let's talk about size and price requirements",
    fields: [
      { name: "minSquareFootage", label: "Minimum square footage", type: "select", options: ["1,000 sqft", "1,500 sqft", "2,000 sqft", "2,500 sqft", "3,000+ sqft"] },
      { name: "minLotSize", label: "Minimum lot square footage", type: "select", options: ["5,000 sqft", "10,000 sqft", "15,000 sqft", "20,000 sqft", "25,000 sqft", "30,000 sqft", "35,000 sqft", "40,000 sqft", "45,000 sqft", "50,000 sqft", "55,000 sqft", "60,000+ sqft"] },
      { name: "priceMin", label: "Minimum price", type: "text", placeholder: "$500,000", isCurrency: true },
      { name: "priceMax", label: "Maximum price", type: "text", placeholder: "$1,800,000", isCurrency: true }
    ]
  },
  {
    title: "Commute Preferences",
    description: "Where do you need to commute to?",
    fields: [
      { name: "commuteAddress1", label: "Commute Address #1", type: "text", placeholder: "Enter address" },
      { name: "commuteMinutes1", label: "Maximum minutes", type: "text", placeholder: "e.g., 30" },
      { name: "commuteAddress2", label: "Commute Address #2", type: "text", placeholder: "Enter address (optional)" },
      { name: "commuteMinutes2", label: "Maximum minutes", type: "text", placeholder: "e.g., 30" }
    ]
  },
  {
    title: "Room Requirements",
    description: "How many rooms do you need?",
    fields: [
      { name: "bedrooms", label: "Bedrooms BR Count Minimum", type: "number", placeholder: "2" },
      { name: "bathrooms", label: "Bathrooms BA Count Minimum", type: "number", placeholder: "1" }
    ]
  },
  {
    title: "Location Preferences",
    description: "Where would you like to live?",
    fields: [
      { name: "cities", label: "Preferred cities", type: "multiselect", options: ["Scottsdale", "Paradise Valley", "Phoenix", "Tempe", "Mesa", "Chandler"] },
      { name: "zipCodes", label: "Preferred zip codes", type: "text", placeholder: "e.g., 85251, 85253" }
    ],
    showMap: true // Flag to show the drawable map section
  },
  {
    title: "Home Features",
    description: "What features are important to you?",
    fields: [
      { name: "homeStyle", label: "Home style preference", type: "select", options: ["Single-story", "Multi-level", "No preference"] },
      { name: "pool", label: "Pool", type: "select", options: ["Yes", "No", "Neutral"] },
      { name: "garageSpaces", label: "Minimum garage spaces", type: "number", placeholder: "2" },
      { name: "hoa", label: "HOA", type: "select", options: ["No HOA", "HOA only", "No preference"] },
      { name: "renovations", label: "Openness to renovations (1-5)", type: "range", min: "1", max: "5" }
    ]
  },
  {
    title: "Current Residence Feedback",
    description: "Tell us about your current home",
    fields: [
      { name: "currentAddress", label: "Current residence address", type: "text", placeholder: "Your current address" },
      { name: "worksWell", label: "What works well?", type: "textarea", placeholder: "What do you like about your current home?" },
      { name: "doesntWork", label: "What doesn't work?", type: "textarea", placeholder: "What would you change?" }
    ]
  },
  {
    title: "Complete Your Profile",
    description: "Enter your email to save your preferences",
    fields: [
      { name: "email", label: "Email Address", type: "email", placeholder: "your@email.com", required: true },
      { name: "firstName", label: "First Name", type: "text", placeholder: "John", required: true },
      { name: "lastName", label: "Last Name", type: "text", placeholder: "Doe", required: true }
    ],
    showSummary: true // Flag to show summary on this page
  }
]

function FormContent() {
  const { user, loading } = useAuth() // Optional auth - form works without login
  const [currentPage, setCurrentPage] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [email, setEmail] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [authVerified, setAuthVerified] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  
  // Always show all 9 pages
  const pagesToShow = formPages
  
  // Log auth state for debugging
  console.log('[FormPage] Render - User:', user?.email || 'null', 'Loading:', loading, 'AuthVerified:', authVerified)

  // Auth verification effect - ensures auth state is fully loaded
  useEffect(() => {
    console.log('[FormPage] Auth verification effect - loading:', loading, 'user:', user?.email)
    if (!loading) {
      // Auth loading is complete, but let's ensure state has propagated
      // This 2-second delay matches our loading animation
      console.log('[FormPage] Starting 2-second verification timer...')
      const verificationTimer = setTimeout(() => {
        console.log('[FormPage] Verification complete - user:', user?.email || 'still null')
        
        // If user just signed up, pre-populate their data on page 9
        if (user) {
          console.log('[FormPage] User authenticated, pre-populating form data')
          setFormData(prev => ({
            ...prev,
            email: user.email || prev.email || '',
            firstName: user.user_metadata?.firstName || prev.firstName || '',
            lastName: user.user_metadata?.lastName || prev.lastName || ''
          }))
        }
        
        setAuthVerified(true)
        setVerificationComplete(true)
      }, 2000)
      
      return () => clearTimeout(verificationTimer)
    }
  }, [loading, user])

  // Check if user is editing existing preferences
  useEffect(() => {
    // Wait for auth verification to complete
    if (authVerified && user) {
      setIsEditMode(true)
      
      // Load existing preferences if user is logged in
      fetch('/api/preferences/load')
        .then(res => res.json())
        .then(data => {
          if (data.preferences) {
            const prefs = data.preferences
            setFormData(prev => ({
              ...prev,
              propertyType: prefs.property_type || '',
              minSquareFootage: prefs.min_square_footage ? `${prefs.min_square_footage.toLocaleString()} sqft` : '',
              minLotSize: prefs.min_lot_square_footage ? `${prefs.min_lot_square_footage.toLocaleString()} sqft` : '',
              priceMin: prefs.price_range_min ? `$${prefs.price_range_min.toLocaleString()}` : '',
              priceMax: prefs.price_range_max ? `$${prefs.price_range_max.toLocaleString()}` : '',
              commuteAddress1: prefs.commute_address_1 || '',
              commuteMinutes1: prefs.commute_max_minutes_1?.toString() || '',
              commuteAddress2: prefs.commute_address_2 || '',
              commuteMinutes2: prefs.commute_max_minutes_2?.toString() || '',
              bedrooms: prefs.bedrooms_needed?.toString() || '',
              bathrooms: prefs.bathrooms_needed?.toString() || '',
              zipCodes: prefs.preferred_zip_codes?.join(', ') || '',
              homeStyle: prefs.home_style === 'single-story' ? 'Single-story' : prefs.home_style === 'multi-level' ? 'Multi-level' : prefs.home_style || '',
              pool: prefs.pool_preference === 'yes' ? 'Yes' : prefs.pool_preference === 'no' ? 'No' : prefs.pool_preference === 'neutral' ? 'Neutral' : '',
              garageSpaces: prefs.min_garage_spaces?.toString() || '',
              hoa: prefs.hoa_preference === 'no_hoa' ? 'No HOA' : prefs.hoa_preference === 'hoa_only' ? 'HOA only' : prefs.hoa_preference === 'no_preference' ? 'No preference' : '',
              renovations: prefs.renovation_openness?.toString() || '',
              currentAddress: prefs.current_residence_address || '',
              worksWell: prefs.current_residence_works_well || '',
              doesntWork: prefs.current_residence_doesnt_work || ''
            }))
            if (prefs.city_preferences) {
              setSelectedCities(prefs.city_preferences)
            }
          }
        })
        .catch(err => console.error('Error loading preferences:', err))
    }
  }, [authVerified, user])

  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '')
    
    // Convert to number and format with commas
    if (numericValue === '') return ''
    
    const number = parseInt(numericValue, 10)
    const formatted = number.toLocaleString('en-US')
    
    return `$${formatted}`
  }

  const handleInputChange = (name: string, value: string, isCurrency?: boolean) => {
    if (isCurrency) {
      // Format currency inputs
      const formattedValue = formatCurrency(value)
      setFormData(prev => ({ ...prev, [name]: formattedValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    )
  }

  const nextPage = () => {
    if (currentPage < pagesToShow.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleSubmit = async () => {
    // Always use /api/preferences/save for authenticated users
    if (user && isAuthenticated) {
      // If user is logged in, save directly to their profile
      try {
        const response = await fetch('/api/preferences/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            cities: selectedCities,
          }),
        })

        if (response.ok) {
          setShowSuccessModal(true)
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to save preferences')
        }
      } catch (error) {
        console.error('Error saving preferences:', error)
        alert('An error occurred. Please try again.')
      }
    } else if (!user && !loading) {
      // New user - submit to API for email verification
      try {
        const response = await fetch('/api/preferences/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            cities: selectedCities,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          // In development, log the verification URL
          if (result.devUrl) {
            console.log('Verification URL:', result.devUrl)
          }
          setShowSuccessModal(true)
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to submit preferences')
        }
      } catch (error) {
        console.error('Error submitting form:', error)
        alert('An error occurred. Please try again.')
      }
    }
  }

  // Show enhanced loading screen while verifying auth state
  if (loading || !verificationComplete) {
    return <AuthLoadingScreen />
  }
  
  const currentFormPage = pagesToShow[currentPage]
  const progress = ((currentPage + 1) / pagesToShow.length) * 100
  const isLastPage = currentPage === pagesToShow.length - 1
  const isAuthenticated = !!user

  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 relative transition-colors">
      {/* Background Assets */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(/assets/noise.png)`,
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed'
          }}
        />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(/assets/gradient.svg)`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center mb-8">
          <img src="/assets/logo.png" alt="Wabbit Logo" className="h-8 w-auto mr-4" />
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentPage + 1} of {pagesToShow.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Form Content */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isAuthenticated && currentPage === 0 ? 'Edit Your Preferences' : 
                 (currentPage === 8 && isAuthenticated ? 'Confirm Your Information' : currentFormPage.title)}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {isAuthenticated && currentPage === 0 ? "Update your home search preferences" : 
                 (currentPage === 8 && isAuthenticated ? 'Your account information has been automatically filled in. Please review before submitting.' : currentFormPage.description)}
              </p>

              <div className="space-y-4">
                {currentFormPage.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.label}
                    </label>
                    
                    {field.type === 'select' && (
                      <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      >
                        <option value="">Select...</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'multiselect' && (
                      <div className="grid grid-cols-2 gap-2">
                        {field.options?.map(option => (
                          <label key={option} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedCities.includes(option)}
                              onChange={() => handleCityToggle(option)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      />
                    )}

                    {field.type === 'range' && (
                      <div>
                        <input
                          type="range"
                          min={field.min}
                          max={field.max}
                          className="w-full"
                          value={formData[field.name] || '3'}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Not Open</span>
                          <span>Very Open</span>
                        </div>
                      </div>
                    )}

                    {(field.type === 'text' || field.type === 'number' || field.type === 'email') && (
                      <>
                        <input
                          type={field.type}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            // Make email/name fields read-only on page 9 for authenticated users
                            (currentPage === 8 && isAuthenticated && ['email', 'firstName', 'lastName'].includes(field.name))
                              ? 'bg-gray-50 cursor-not-allowed'
                              : ''
                          }`}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value, field.isCurrency)}
                          readOnly={currentPage === 8 && isAuthenticated && ['email', 'firstName', 'lastName'].includes(field.name)}
                        />
                        {/* Show note for pre-filled fields */}
                        {currentPage === 8 && isAuthenticated && ['email', 'firstName', 'lastName'].includes(field.name) && formData[field.name] && (
                          <p className="text-xs text-gray-500 mt-1">✓ Auto-filled from your account</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Show summary on the last page */}
              {currentFormPage.showSummary && (
                <ResponseSummary 
                  formData={formData} 
                  selectedCities={selectedCities}
                />
              )}
              
              {/* Show drawable map for Location Preferences page */}
              {(currentFormPage as any).showMap && (
                <LocationMapSection />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className={`px-6 py-2 rounded-lg font-medium ${
                  currentPage === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>

              {isLastPage ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  disabled={!isAuthenticated && (!formData.email || !formData.firstName || !formData.lastName)}
                >
                  {isAuthenticated ? 'Submit My Preferences' : 'Submit & Create Account'}
                </button>
              ) : (
                <button
                  onClick={nextPage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">
              {isAuthenticated ? 'Preferences Updated!' : 'Form Submit Successful'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Please allow 3-4 hours for processing of on-market & coming soon properties based on your criteria. 
              Strongly consider signing into your preferred real estate search tool to migrate your Favorited 
              listings over to the Rank Feed for your AI agent to further learn your preferences.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
              <Link
                href="/rank-feed"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
              >
                Continue to Rank Feed
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Demo Banner */}
      <DemoBanner />
    </div>
  )
}

function LocationMapSection() {
  const { searchAreas, deleteSearchArea, toggleAreaActive, loadSearchAreas, isLoading } = useMapContext()
  const [showMapInstructions, setShowMapInstructions] = useState(true)
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false)
  const [manualRefreshKey, setManualRefreshKey] = useState(0)
  
  // Load search areas when component mounts
  useEffect(() => {
    if (!hasLoadedInitially) {
      console.log('LocationMapSection: Loading search areas...')
      loadSearchAreas().then(() => {
        console.log('LocationMapSection: Search areas loaded, count:', searchAreas.length)
        setHasLoadedInitially(true)
      })
    }
  }, [hasLoadedInitially, loadSearchAreas])

  const handleRefreshMap = () => {
    console.log('LocationMapSection: Manual refresh triggered')
    setManualRefreshKey(prev => prev + 1)
    loadSearchAreas()
  }
  
  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center justify-between">
        <span>
          Define Your Search Areas (Optional)
          {isLoading && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              Loading saved areas...
            </span>
          )}
          {!isLoading && searchAreas.length > 0 && (
            <span className="ml-2 text-sm text-green-600 dark:text-green-400">
              ({searchAreas.length} area{searchAreas.length !== 1 ? 's' : ''} loaded)
            </span>
          )}
        </span>
        <button
          onClick={handleRefreshMap}
          className="text-sm px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          title="Refresh map areas"
        >
          🔄 Refresh Map
        </button>
      </h3>
      
      {showMapInstructions && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                Draw areas on the map to define your preferred neighborhoods
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Use the drawing tools above the map to create search areas</li>
                <li>• Draw rectangles, polygons, or circles around desired neighborhoods</li>
                <li>• Mark areas to include or exclude from your property search</li>
                <li>• Your drawn areas will be saved with your preferences</li>
              </ul>
            </div>
            <button
              onClick={() => setShowMapInstructions(false)}
              className="text-blue-600 hover:text-blue-800 text-sm ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <PropertyMap
            key={manualRefreshKey}
            properties={[]}
            height="400px"
            showPropertyMarkers={false}
            onAreaDrawn={(area) => console.log('Area drawn in form:', area)}
          />
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Your Search Areas</h4>
            {searchAreas.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No areas drawn yet. Use the drawing tools on the map to define your preferred neighborhoods.
              </p>
            ) : (
              <div className="space-y-2">
                {searchAreas.map(area => (
                  <div
                    key={area.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                          {area.area_name}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {area.area_type} • {area.is_inclusion ? 'Include' : 'Exclude'}
                        </p>
                        {area.property_count !== undefined && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {area.property_count} properties
                          </p>
                        )}
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
        </div>
      </div>
    </div>
  )
}

export default function FormPage() {
  return (
    <MapProvider>
      <FormContent />
    </MapProvider>
  )
}
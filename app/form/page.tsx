'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import DemoBanner from '@/components/DemoBanner'
import ResponseSummary from '@/components/form/ResponseSummary'

const formPages = [
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
      { name: "minLotSize", label: "Minimum lot square footage", type: "text", placeholder: "e.g., 5,000 sqft" },
      { name: "priceMin", label: "Minimum price", type: "text", placeholder: "$500,000" },
      { name: "priceMax", label: "Maximum price", type: "text", placeholder: "$1,800,000" }
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
      { name: "bedrooms", label: "Bedrooms needed", type: "number", placeholder: "3" },
      { name: "bathrooms", label: "Bathrooms needed", type: "number", placeholder: "2" }
    ]
  },
  {
    title: "Location Preferences",
    description: "Where would you like to live?",
    fields: [
      { name: "cities", label: "Preferred cities", type: "multiselect", options: ["Scottsdale", "Paradise Valley", "Phoenix", "Tempe", "Mesa", "Chandler"] },
      { name: "zipCodes", label: "Preferred zip codes", type: "text", placeholder: "e.g., 85251, 85253" }
    ]
  },
  {
    title: "Home Features",
    description: "What features are important to you?",
    fields: [
      { name: "homeStyle", label: "Home style preference", type: "select", options: ["Single-story", "Multi-level", "No preference"] },
      { name: "pool", label: "Do you want a pool?", type: "select", options: ["Yes", "No", "Neutral"] },
      { name: "garageSpaces", label: "Minimum garage spaces", type: "number", placeholder: "2" },
      { name: "hoa", label: "Thoughts on HOAs?", type: "select", options: ["Need", "Want", "Neutral", "Don't Need", "Don't Want"] },
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

export default function FormPage() {
  const { user, loading } = useAuth() // Optional auth - form works without login
  const [currentPage, setCurrentPage] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [email, setEmail] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)

  // Check if user is editing existing preferences
  useEffect(() => {
    if (user) {
      setIsEditMode(true)
      // Load existing preferences if user is logged in
      // This would fetch from database
    }
  }, [user])

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    )
  }

  const nextPage = () => {
    if (currentPage < formPages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleSubmit = async () => {
    if (isEditMode && user) {
      // If user is logged in, save directly to their profile
      // TODO: Implement save to user profile
      setShowSuccessModal(true)
    } else {
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

  const currentFormPage = formPages[currentPage]
  const progress = ((currentPage + 1) / formPages.length) * 100

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
                <span>Step {currentPage + 1} of {formPages.length}</span>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentFormPage.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{currentFormPage.description}</p>

              <div className="space-y-4">
                {currentFormPage.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.label}
                    </label>
                    
                    {field.type === 'select' && (
                      <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Not Open</span>
                          <span>Very Open</span>
                        </div>
                      </div>
                    )}

                    {(field.type === 'text' || field.type === 'number' || field.type === 'email') && (
                      <input
                        type={field.type}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={field.placeholder}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      />
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

              {currentPage === formPages.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  disabled={!formData.email || !formData.firstName || !formData.lastName}
                >
                  {isEditMode ? 'Save Changes' : 'Submit & Create Account'}
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">Form Submit Successful</h2>
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
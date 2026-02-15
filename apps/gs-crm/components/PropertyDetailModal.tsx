'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PropertyDetailModalProps {
  isOpen: boolean
  onClose: () => void
  property: any
}

export default function PropertyDetailModal({ isOpen, onClose, property }: PropertyDetailModalProps) {
  const [allImages, setAllImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (isOpen && property?.id) {
      fetchAllImages()
    }
  }, [isOpen, property?.id])
  
  async function fetchAllImages() {
    setLoading(true)
    const supabase = createClient()
    
    const { data: images } = await supabase
      .from('property_images')
      .select('image_url, image_type, display_order')
      .eq('property_id', property.id)
      .order('display_order', { ascending: true })
    
    if (images && images.length > 0) {
      setAllImages(images.map(img => img.image_url))
    } else if (property.image && property.image !== '/api/placeholder/400/300') {
      // Fallback to single image if no images in table
      setAllImages([property.image])
    } else {
      setAllImages([])
    }
    setLoading(false)
  }
  
  if (!isOpen) return null
  
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex flex-col lg:flex-row">
            {/* Image Gallery Section */}
            <div className="lg:w-3/5 bg-gray-100 relative">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : allImages.length > 0 ? (
                <div className="relative h-96 lg:h-[600px]">
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${property.address} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/api/placeholder/800/600'
                    }}
                  />
                  
                  {/* Image navigation */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Image counter */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-200">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              
              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto bg-gray-900">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 ${
                        idx === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-20 h-16 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/api/placeholder/80/60'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Property Details Section */}
            <div className="lg:w-2/5 p-6">
              <h2 className="text-2xl font-bold mb-2">{property.address}</h2>
              <p className="text-gray-600 mb-4">
                {property.city}, {property.state} {property.zip_code}
              </p>
              
              <div className="text-3xl font-bold text-green-600 mb-6">
                {property.price}
              </div>
              
              {/* Property Features */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-500 text-sm">Bedrooms</p>
                  <p className="font-semibold">{property.beds}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Bathrooms</p>
                  <p className="font-semibold">{property.baths}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Square Feet</p>
                  <p className="font-semibold">{property.sqft?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Property Type</p>
                  <p className="font-semibold">{property.property_type || 'Single Family'}</p>
                </div>
              </div>
              
              {/* Additional Details */}
              <div className="border-t pt-4 mb-6">
                <h3 className="font-semibold mb-3">Additional Details</h3>
                <div className="space-y-2 text-sm">
                  {property.year_built && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Year Built</span>
                      <span>{property.year_built}</span>
                    </div>
                  )}
                  {property.has_pool !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pool</span>
                      <span>{property.has_pool ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {property.garage_spaces !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Garage Spaces</span>
                      <span>{property.garage_spaces}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Average Ranking</span>
                    <span className="font-semibold text-blue-600">{property.avgRanking}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/rank-feed'}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Rank Property
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
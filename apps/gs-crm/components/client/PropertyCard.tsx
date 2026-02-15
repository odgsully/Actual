'use client'

import { Building2, Bed, Bath, Maximize2, Heart, MapPin } from 'lucide-react'
import { useState } from 'react'

interface PropertyCardProps {
  property: {
    id: string
    address: string
    city?: string
    state?: string
    zip?: string
    price?: number
    bedrooms?: number
    bathrooms?: number
    square_feet?: number
    status?: string
    image_url?: string
    is_favorite?: boolean
  }
  onToggleFavorite?: (propertyId: string) => void
}

export function PropertyCard({ property, onToggleFavorite }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(property.is_favorite || false)

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite)
    onToggleFavorite?.(property.id)
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-red-100 text-red-800'
      case 'contingent':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? 'fill-brand-red text-brand-red' : 'text-gray-600'
            }`}
          />
        </button>

        {/* Status Badge */}
        {property.status && (
          <div className="absolute bottom-3 left-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                property.status
              )}`}
            >
              {property.status}
            </span>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5">
        {/* Price */}
        <div className="mb-3">
          <h3 className="text-2xl font-bold text-brand-black">
            {formatPrice(property.price)}
          </h3>
        </div>

        {/* Address */}
        <div className="mb-3">
          <h4 className="font-semibold text-brand-black mb-1">{property.address}</h4>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            <span>
              {property.city}, {property.state} {property.zip}
            </span>
          </div>
        </div>

        {/* Property Features */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-1 text-gray-700">
            <Bed className="w-4 h-4" />
            <span className="text-sm font-medium">{property.bedrooms || 0}</span>
            <span className="text-xs text-gray-600">beds</span>
          </div>

          <div className="w-px h-6 bg-gray-300"></div>

          <div className="flex items-center space-x-1 text-gray-700">
            <Bath className="w-4 h-4" />
            <span className="text-sm font-medium">{property.bathrooms || 0}</span>
            <span className="text-xs text-gray-600">baths</span>
          </div>

          <div className="w-px h-6 bg-gray-300"></div>

          <div className="flex items-center space-x-1 text-gray-700">
            <Maximize2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {property.square_feet?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-gray-600">sqft</span>
          </div>
        </div>

        {/* View Details Button */}
        <button className="w-full mt-4 px-4 py-2 bg-brand-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
          View Details
        </button>
      </div>
    </div>
  )
}

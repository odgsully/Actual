import React from 'react'

interface ResponseSummaryProps {
  formData: any
  selectedCities: string[]
}

export default function ResponseSummary({ formData, selectedCities }: ResponseSummaryProps) {
  const formatValue = (value: any) => {
    if (value === undefined || value === null || value === '') return 'Not specified'
    return value
  }

  const formatPrice = (price: string) => {
    if (!price) return 'Not specified'
    // If price doesn't start with $, add it
    return price.startsWith('$') ? price : `$${price}`
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Your Preferences Summary</h3>
      
      <div className="space-y-4 text-sm">
        {/* Property Type */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Property Details</h4>
          <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
            <div>Property Type: <span className="font-medium">{formatValue(formData.propertyType)}</span></div>
            <div>Home Style: <span className="font-medium">{formatValue(formData.homeStyle)}</span></div>
          </div>
        </div>

        {/* Size & Budget */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Size & Budget</h4>
          <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
            <div>Min Square Footage: <span className="font-medium">{formatValue(formData.minSquareFootage)}</span></div>
            <div>Min Lot Size: <span className="font-medium">{formatValue(formData.minLotSize)}</span></div>
            <div>Price Range: <span className="font-medium">{formatPrice(formData.priceMin)} - {formatPrice(formData.priceMax)}</span></div>
          </div>
        </div>

        {/* Rooms */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Room Requirements</h4>
          <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
            <div>Bedrooms BR Count Minimum: <span className="font-medium">{formatValue(formData.bedrooms)}</span></div>
            <div>Bathrooms BA Count Minimum: <span className="font-medium">{formatValue(formData.bathrooms)}</span></div>
          </div>
        </div>

        {/* Location */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Location Preferences</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>Cities: <span className="font-medium">{selectedCities.length > 0 ? selectedCities.join(', ') : 'Not specified'}</span></div>
            <div>Zip Codes: <span className="font-medium">{formatValue(formData.zipCodes)}</span></div>
          </div>
        </div>

        {/* Commute */}
        {(formData.commuteAddress1 || formData.commuteAddress2) && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Commute Preferences</h4>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
              {formData.commuteAddress1 && (
                <div>Commute 1: <span className="font-medium">{formData.commuteAddress1} ({formData.commuteMinutes1 || '?'} min)</span></div>
              )}
              {formData.commuteAddress2 && (
                <div>Commute 2: <span className="font-medium">{formData.commuteAddress2} ({formData.commuteMinutes2 || '?'} min)</span></div>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Home Features</h4>
          <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
            <div>Pool: <span className="font-medium">{formatValue(formData.pool)}</span></div>
            <div>Garage Spaces: <span className="font-medium">{formatValue(formData.garageSpaces)}</span></div>
            <div>HOA: <span className="font-medium">{formatValue(formData.hoa)}</span></div>
            <div>Renovation Openness: <span className="font-medium">{formatValue(formData.renovations)}/5</span></div>
          </div>
        </div>

        {/* Current Residence */}
        {formData.currentAddress && (
          <div className="pb-3">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Current Residence</h4>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
              <div>Address: <span className="font-medium">{formData.currentAddress}</span></div>
              {formData.worksWell && (
                <div>What works: <span className="font-medium">{formData.worksWell}</span></div>
              )}
              {formData.doesntWork && (
                <div>What doesn't: <span className="font-medium">{formData.doesntWork}</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
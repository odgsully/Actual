import React from 'react'
import { EntertainmentDistrict } from '@/lib/map/location-data-service'

interface EntertainmentTableProps {
  districts: EntertainmentDistrict[]
  isExpanded?: boolean
}

const EntertainmentTable: React.FC<EntertainmentTableProps> = ({ districts, isExpanded = false }) => {
  const displayDistricts = isExpanded ? districts : districts.slice(0, 5)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
        <span className="w-3 h-3 bg-purple-500 rounded-full mr-2" />
        Entertainment Districts
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Name</th>
              <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Address</th>
              <th className="text-right py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Distance</th>
            </tr>
          </thead>
          <tbody>
            {displayDistricts.map((district, idx) => (
              <tr key={idx} className="border-b dark:border-gray-700">
                <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">
                  {district.name}
                </td>
                <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                  {district.address}
                </td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                  {district.distance} mi
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {!isExpanded && districts.length > 5 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Showing nearest {displayDistricts.length} districts
        </p>
      )}
      
      <div className="mt-3 pt-3 border-t dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Featured:</strong> Fashion Square Mall, Biltmore Fashion District, Desert Ridge, Old Town Scottsdale
        </p>
      </div>
    </div>
  )
}

export default EntertainmentTable
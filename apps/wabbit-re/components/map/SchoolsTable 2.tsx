import React from 'react'
import { SchoolData } from '@/lib/map/location-data-service'

interface SchoolsTableProps {
  schools: SchoolData[]
  isExpanded?: boolean
}

const SchoolsTable: React.FC<SchoolsTableProps> = ({ schools, isExpanded = false }) => {
  // Separate private and public schools
  const privateSchools = schools.filter(s => s.type === 'Private').slice(0, 3)
  const publicSchools = schools.filter(s => s.type === 'Public')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
        Schools & Education
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Type</th>
              <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">School Name</th>
              <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Grades</th>
              <th className="text-right py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Distance</th>
              <th className="text-right py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Students</th>
            </tr>
          </thead>
          <tbody>
            {/* Private Schools */}
            {privateSchools.map((school, idx) => (
              <tr key={`private-${idx}`} className="border-b dark:border-gray-700">
                <td className="py-2 px-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                    Private
                  </span>
                </td>
                <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">
                  {school.name}
                </td>
                <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                  {school.grades}
                </td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                  {school.distance} mi
                </td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                  {school.studentPopulation.toLocaleString()}
                </td>
              </tr>
            ))}
            
            {/* Public Schools */}
            {publicSchools.map((school, idx) => (
              <tr key={`public-${idx}`} className="border-b dark:border-gray-700">
                <td className="py-2 px-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                    Public
                  </span>
                </td>
                <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">
                  {school.name}
                </td>
                <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                  {school.grades}
                </td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                  {school.distance} mi
                </td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                  {school.studentPopulation.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {!isExpanded && schools.length > 6 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Showing top {Math.min(6, schools.length)} schools. Click to see more...
        </p>
      )}
    </div>
  )
}

export default SchoolsTable
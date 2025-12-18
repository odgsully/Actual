import React from 'react'
import { GroceryStore } from '@/lib/map/location-data-service'

interface GroceriesTableProps {
  stores: GroceryStore[]
  isExpanded?: boolean
}

const GroceriesTable: React.FC<GroceriesTableProps> = ({ stores, isExpanded = false }) => {
  // Ensure we show Costco and Trader Joe's if available
  const costco = stores.find(s => s.name.toLowerCase().includes('costco'))
  const traderJoes = stores.find(s => s.name.toLowerCase().includes('trader'))
  const otherStores = stores.filter(s => 
    !s.name.toLowerCase().includes('costco') && 
    !s.name.toLowerCase().includes('trader')
  )

  // Build display list with Costco and Trader Joe's first
  const displayStores = []
  if (costco) displayStores.push(costco)
  if (traderJoes) displayStores.push(traderJoes)
  displayStores.push(...otherStores.slice(0, 3 - displayStores.length))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
        <span className="w-3 h-3 bg-green-500 rounded-full mr-2" />
        Grocery Stores
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Store Name</th>
              <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Address</th>
              <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Type</th>
            </tr>
          </thead>
          <tbody>
            {displayStores.map((store, idx) => (
              <tr key={idx} className="border-b dark:border-gray-700">
                <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">
                  {store.name}
                  {store.name.toLowerCase().includes('costco') && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      Nearest
                    </span>
                  )}
                  {store.name.toLowerCase().includes('trader') && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">
                      Nearest
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                  {store.address}
                </td>
                <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                  {store.type || 'Grocery'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-3 pt-3 border-t dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> Showing nearest Costco, Trader Joe's, and other grocery options
        </p>
      </div>
    </div>
  )
}

export default GroceriesTable
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function ProfileMenu() {
  const { user, signOut, loading } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  if (loading) {
    return (
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    )
  }

  if (!user) {
    return null
  }

  const getUserInitials = () => {
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
          {getUserInitials()}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Signed in as</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
            </div>

            <Link
              href="/settings"
              onClick={() => setShowDropdown(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <button
              onClick={async () => {
                setShowDropdown(false)
                await signOut()
              }}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import SignInModal from '@/components/auth/SignInModal'
import DemoBanner from '@/components/DemoBanner'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const { user, loading, showSignIn, setShowSignIn } = useRequireAuth()
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [fontSize, setFontSize] = useState(3)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [profileData, setProfileData] = useState({
    email: '',
    firstName: '',
    lastName: ''
  })

  // Load user data when available
  useEffect(() => {
    if (user) {
      setProfileData({
        email: user.email || '',
        firstName: user.user_metadata?.firstName || '',
        lastName: user.user_metadata?.lastName || ''
      })
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const fontSizeLabels = ['Tiny', 'Small', 'Medium', 'Large', 'Extra Large']
  const fontSizeClasses = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl']
  const currentFontClass = fontSizeClasses[fontSize - 1]
  
  const isDarkMode = theme === 'dark'
  
  const toggleDarkMode = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  const handleInvite = () => {
    alert(`Invitation sent to: ${inviteInput}`)
    setInviteInput('')
    setShowInviteModal(false)
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative transition-colors">
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
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b dark:border-gray-700 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/assets/logo.png" alt="Wabbit Logo" className="h-8 w-auto" />
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Home
              </Link>
            </div>
            <div className="flex space-x-6">
              <Link href="/rank-feed" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Rank Feed
              </Link>
              <Link href="/list-view" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                List View
              </Link>
              <Link href="/settings" className="font-semibold text-blue-600 border-b-2 border-blue-600 pb-1">
                More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <h1 className={`text-3xl font-bold text-gray-900 dark:text-white mb-8 ${currentFontClass}`}>Settings</h1>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg divide-y dark:divide-gray-700">
            {/* Account Settings */}
            <div className="p-6">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${currentFontClass}`}>Account</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <span className="text-gray-700 dark:text-gray-300">Profile Settings</span>
                </button>
                <Link 
                  href="/form"
                  className="block w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <span className="text-gray-700 dark:text-gray-300">Edit Property Preferences Form</span>
                </Link>
                <button 
                  onClick={async () => {
                    await signOut()
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <span className="text-red-600">Sign Out</span>
                </button>
              </div>
            </div>

            {/* Third Party Connections */}
            <div className="p-6">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${currentFontClass}`}>Connect Platforms</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      Z
                    </div>
                    <span>Zillow</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Not connected</span>
                </button>
                <button className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      R
                    </div>
                    <span>Redfin</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Not connected</span>
                </button>
                <button className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      H
                    </div>
                    <span>Homes.com</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Not connected</span>
                </button>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${currentFontClass}`}>Dark Mode</h3>
                  <p className={`text-sm text-gray-600 dark:text-gray-300 ${currentFontClass}`}>Toggle between light and dark themes</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="p-6">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${currentFontClass}`}>Font Size</h3>
              <div className="flex items-center space-x-4">
                <span className="text-xs">a</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-2xl">A</span>
              </div>
              <div className={`mt-4 p-3 bg-gray-50 rounded-lg ${currentFontClass}`}>
                <p className="text-gray-600 dark:text-gray-300">Preview: This text shows your current font size ({fontSizeLabels[fontSize - 1]})</p>
              </div>
            </div>

            {/* Invite Friends */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${currentFontClass}`}>Invite Friends</h3>
                  <p className={`text-sm text-gray-600 dark:text-gray-300 ${currentFontClass}`}>Collaborate on property rankings</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Invite
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({...prev, firstName: e.target.value}))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({...prev, lastName: e.target.value}))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save profile changes here
                  setShowProfileModal(false)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Invite a Friend</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Enter their email or phone number to send an invitation
            </p>
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Email or phone number"
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

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
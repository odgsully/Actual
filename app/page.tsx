'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProfileMenu from '@/components/auth/ProfileMenu'
import SignInModal from '@/components/auth/SignInModal'
import { User } from 'lucide-react'

export default function HomePage() {
  const { user, signIn } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [isDemoLoading, setIsDemoLoading] = useState(false)

  const handleDemoMode = async () => {
    // Auto-sign in as demo user with correct credentials
    setIsDemoLoading(true)
    try {
      const { error } = await signIn('support@wabbit-rank.ai', '17026ZvSe!!')
      if (!error) {
        // Successfully signed in, navigate to list view
        window.location.href = '/list-view'
      } else {
        // Log error for debugging
        console.error('Demo sign-in failed:', error)
        // Try to create a helpful error message
        alert('Demo mode is being set up. Please try again in a moment or contact support.')
        setIsDemoLoading(false)
      }
    } catch (err) {
      console.error('Demo mode error:', err)
      alert('Demo mode is temporarily unavailable. Please try again later.')
      setIsDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative transition-colors">
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
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url(/assets/grid.svg)`,
            backgroundSize: '300px 300px',
            backgroundRepeat: 'repeat'
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
      
      {/* Profile Menu */}
      <div className="absolute top-4 right-4 z-20">
        {user ? (
          <ProfileMenu />
        ) : (
          <button
            onClick={() => setShowSignIn(true)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm bg-white/5"
          >
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Sign In</span>
          </button>
        )}
      </div>

      {/* Modern Hero Layout */}
      <div className="min-h-screen flex flex-col relative z-10">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-6xl mx-auto">
            {/* Logo & Title */}
            <div className="mb-16">
              <div className="flex justify-center mb-8">
                <img src="/assets/logo.png" alt="Wabbit Logo" className="h-32 md:h-40 w-auto" />
              </div>
              <div className="flex justify-center items-center mb-6">
                <img src="/assets/logo.png" alt="Wabbit Logo" className="h-20 w-auto mr-6" />
                <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white font-proxima tracking-tight">Wabbit</h1>
              </div>
              <p className="text-2xl text-gray-600 dark:text-gray-300 font-light">Real Estate Discovery Platform powered by AI powered by You</p>
            </div>

            {/* Navigation Cards - Modern Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Sign Up Card */}
              <Link href="/signup" className="group relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                      <svg className="w-6 h-6 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Sign Up</h3>
                  <p className="text-teal-100 text-lg">Create your account</p>
                </div>
              </Link>

              {/* Preferences Form Card - Now accessible without authentication */}
              <Link 
                href="/form"
                className="group relative overflow-hidden bg-gradient-to-br from-pink-700 to-pink-800 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 block">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-pink-700 to-pink-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                      <svg className="w-6 h-6 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Preferences Form</h3>
                  <p className="text-pink-100 text-lg">7-page buyer preferences questionnaire</p>
                </div>
              </Link>

              {/* Rank Feed Card */}
              <button
                onClick={() => {
                  if (!user) {
                    setPendingNavigation('/rank-feed')
                    setShowSignIn(true)
                  } else {
                    window.location.href = '/rank-feed'
                  }
                }}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full text-left">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                      <svg className="w-6 h-6 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Rank Feed</h3>
                  <p className="text-blue-100 text-lg">Train your AI by ranking properties</p>
                </div>
              </button>

              {/* List View Card */}
              <button
                onClick={() => {
                  if (!user) {
                    setPendingNavigation('/list-view')
                    setShowSignIn(true)
                  } else {
                    window.location.href = '/list-view'
                  }
                }}
                className="group relative overflow-hidden bg-gradient-to-br from-green-700 to-green-800 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full text-left">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                      <svg className="w-6 h-6 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">List View</h3>
                  <p className="text-green-100 text-lg">View all prospective properties</p>
                </div>
              </button>

              {/* Settings Card */}
              <button
                onClick={() => {
                  if (!user) {
                    setPendingNavigation('/settings')
                    setShowSignIn(true)
                  } else {
                    window.location.href = '/settings'
                  }
                }}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full text-left">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                      <svg className="w-6 h-6 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Settings</h3>
                  <p className="text-slate-200 text-lg">Integrate, invite and other features</p>
                </div>
              </button>

              {/* Demo Card */}
              <button
                onClick={handleDemoMode}
                disabled={isDemoLoading}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full text-left disabled:opacity-75 disabled:cursor-not-allowed">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                      <svg className="w-6 h-6 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    {isDemoLoading ? 'Signing in...' : 'Full Demo'}
                  </h3>
                  <p className="text-blue-100 text-lg">
                    {isDemoLoading ? 'Please wait...' : 'Complete platform with sample data'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignIn}
        onClose={() => {
          setShowSignIn(false)
          setPendingNavigation(null)
        }}
        onSuccess={() => {
          if (pendingNavigation) {
            window.location.href = pendingNavigation
          }
        }}
      />
    </div>
  )
}
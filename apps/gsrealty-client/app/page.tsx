'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { BRAND } from '@/lib/constants/branding'
import { User, Home, Upload, Search, Settings } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleSignIn = () => {
    setIsRedirecting(true)
    router.push('/signin')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <header className="absolute top-0 right-0 p-6 z-20">
        <div className="flex items-center space-x-4">
          <img
            src={BRAND.logo}
            alt={BRAND.logoAlt}
            className="h-16 w-auto"
          />
          {!user && (
            <button
              onClick={handleSignIn}
              disabled={isRedirecting}
              className="flex items-center space-x-2 px-6 py-3 bg-brand-black text-white rounded-lg hover:bg-brand-gray-dark transition-colors disabled:opacity-50"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">{isRedirecting ? 'Redirecting...' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo & Title */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-bold text-brand-black mb-4 tracking-tight">
              {BRAND.name}
            </h1>
            <p className="text-2xl text-brand-gray-medium font-light">
              {BRAND.tagline}
            </p>
            <p className="text-lg text-brand-gray-medium mt-2">
              {BRAND.location}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
            {/* Client Management */}
            <div className="p-8 border-2 border-brand-black rounded-lg hover:bg-brand-gray-light transition-colors">
              <div className="w-14 h-14 bg-brand-black rounded-lg flex items-center justify-center mx-auto mb-4">
                <Home className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-2">Client Management</h3>
              <p className="text-brand-gray-medium">
                Organize and track all client information in one secure location
              </p>
            </div>

            {/* File Upload */}
            <div className="p-8 border-2 border-brand-black rounded-lg hover:bg-brand-gray-light transition-colors">
              <div className="w-14 h-14 bg-brand-red rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-2">MLS Data Processing</h3>
              <p className="text-brand-gray-medium">
                Upload and process MLS comps with automated Excel generation
              </p>
            </div>

            {/* MCAO Integration */}
            <div className="p-8 border-2 border-brand-black rounded-lg hover:bg-brand-gray-light transition-colors">
              <div className="w-14 h-14 bg-brand-black rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-2">MCAO Property Lookup</h3>
              <p className="text-brand-gray-medium">
                Instant access to Maricopa County Assessor property data
              </p>
            </div>

            {/* Client Portal */}
            <div className="p-8 border-2 border-brand-black rounded-lg hover:bg-brand-gray-light transition-colors">
              <div className="w-14 h-14 bg-brand-red rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-2">Client Portal</h3>
              <p className="text-brand-gray-medium">
                Secure portal for clients to view properties and documents
              </p>
            </div>
          </div>

          {/* CTA Button */}
          {!user && (
            <div className="mt-12">
              <button
                onClick={handleSignIn}
                disabled={isRedirecting}
                className="px-12 py-4 bg-brand-red text-white text-lg font-semibold rounded-lg hover:bg-brand-red-hover transition-colors shadow-lg disabled:opacity-50"
              >
                {isRedirecting ? 'Redirecting...' : 'Access Client Management'}
              </button>
            </div>
          )}

          {user && (
            <div className="mt-12 p-6 bg-brand-gray-light border-2 border-brand-black rounded-lg">
              <p className="text-brand-gray-medium mb-4">
                Welcome back! Choose your destination:
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="px-6 py-3 bg-brand-black text-white rounded-lg hover:bg-brand-gray-dark transition-colors font-medium"
                >
                  Admin Dashboard
                </button>
                <button
                  onClick={() => router.push('/client')}
                  className="px-6 py-3 bg-brand-red text-white rounded-lg hover:bg-brand-red-hover transition-colors font-medium"
                >
                  Client Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center text-brand-gray-medium text-sm">
        <p>&copy; 2025 {BRAND.fullName}. All rights reserved.</p>
        <p className="mt-1">{BRAND.location}</p>
      </footer>
    </div>
  )
}

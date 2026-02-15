'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { BRAND } from '@/lib/constants/branding'
import { User } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleSignIn = () => {
    setIsRedirecting(true)
    router.push('/signin')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Arizona Night Cityscape */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1920&q=80)'
        }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

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
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo & Title */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
              {BRAND.name}
            </h1>
            <p className="text-2xl text-white/80 font-light">
              Professional Client & Property Listing Management
            </p>
            <p className="text-lg text-white/60 mt-2">
              {BRAND.location}
            </p>
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
            <div className="mt-12 p-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl">
              <div className="flex justify-center">
                <button
                  onClick={() => router.push('/client')}
                  className="px-8 py-4 bg-brand-red text-white text-lg rounded-lg hover:bg-brand-red-hover transition-all duration-300 font-medium"
                >
                  Client Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center z-10">
        {user && (
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 px-4 py-2 text-white/60 hover:text-white text-sm transition-all duration-300 hover:bg-white/10 rounded-lg"
          >
            Admin Dashboard
          </button>
        )}
        <p className="text-white/60 text-sm">&copy; 2025 {BRAND.fullName}. All rights reserved.</p>
        <p className="text-white/60 text-sm mt-1">{BRAND.location}</p>
      </footer>
    </div>
  )
}

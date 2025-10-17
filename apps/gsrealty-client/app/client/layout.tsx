'use client'

import { useAuth } from '@/contexts/AuthContext'
import { BRAND } from '@/lib/constants/branding'
import { ClientNav } from '@/components/client/ClientNav'
import { ClientHeader } from '@/components/client/ClientHeader'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('[Client Layout] No user, redirecting to signin')
        router.push('/signin')
      } else if (role === 'admin') {
        console.log('[Client Layout] Admin user, redirecting to admin dashboard')
        router.push('/admin')
      }
    }
  }, [user, role, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not a client
  if (!user || role !== 'client') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/client/dashboard" className="flex items-center space-x-3">
              <Image
                src={BRAND.logo}
                alt={BRAND.logoAlt}
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-brand-black">{BRAND.name}</h1>
                <p className="text-xs text-gray-600">Client Portal</p>
              </div>
            </Link>

            {/* Navigation */}
            <ClientNav />

            {/* User Menu */}
            <ClientHeader />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} {BRAND.name}. {BRAND.tagline}</p>
            <p className="mt-1">Contact: {BRAND.contact.email}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

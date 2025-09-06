'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    privacyAccepted: false,
    marketingOptIn: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.privacyAccepted) {
      setError('Please accept the privacy statement to continue')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    const { error, user } = await signUp(formData.email, formData.password, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      marketingOptIn: formData.marketingOptIn,
      privacyAccepted: formData.privacyAccepted
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (user) {
      console.log('[SignUpPage] Signup successful - user:', user.email)
      // Show success message
      setSuccessMessage('Account created successfully! Redirecting to preferences...')
      // Check session before redirect
      console.log('[SignUpPage] Waiting before redirect...')
      setTimeout(async () => {
        // Verify session is established before redirecting
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[SignUpPage] Session before redirect:', session ? `Valid - ${session.user.email}` : 'No session')
        console.log('[SignUpPage] Using hard redirect to /form...')
        // Use window.location for a hard redirect to ensure session persistence
        window.location.href = '/form'
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 relative transition-colors">
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
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(/assets/gradient.svg)`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
      </div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="flex items-center mb-8">
          <img src="/assets/logo.png" alt="Wabbit Logo" className="h-8 w-auto mr-4" />
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
        
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-2">
              <img src="/assets/logo.png" alt="Wabbit Logo" className="h-12 w-auto mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Wabbit</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Create your account to find your perfect home</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="privacyAccepted"
                  required
                  checked={formData.privacyAccepted}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                  I accept the <a href="#" className="text-blue-600 hover:text-blue-800">privacy statement</a> and 
                  <a href="#" className="text-blue-600 hover:text-blue-800"> terms of service</a> *
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="marketingOptIn"
                  checked={formData.marketingOptIn}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                  Subscribe to receive Wabbit updates and real estate insights
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
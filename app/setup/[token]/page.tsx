'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DemoBanner from '@/components/DemoBanner'

export default function SetupPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preferences, setPreferences] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    validateToken()
  }, [])

  const validateToken = async () => {
    try {
      const response = await fetch('/api/setup/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token }),
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      } else {
        const error = await response.json()
        setError(error.message || 'Invalid or expired verification link')
      }
    } catch (err) {
      setError('Failed to validate verification link')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!privacyAccepted) {
      setError('You must accept the privacy policy to continue')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: params.token,
          password,
          privacyAccepted,
          marketingOptIn,
        }),
      })

      if (response.ok) {
        // Auto sign in with new credentials
        const supabase = createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: preferences.email,
          password,
        })

        if (!signInError) {
          router.push('/rank-feed')
        } else {
          router.push('/signin?success=true')
        }
      } else {
        const error = await response.json()
        setError(error.message || 'Failed to complete setup')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Validating verification link...</div>
      </div>
    )
  }

  if (error && !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/form" className="text-blue-600 hover:text-blue-800">
            Return to Preferences Form →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <img src="/assets/logo.png" alt="Wabbit Logo" className="h-8 w-auto mr-4" />
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Account Setup</h1>
            <p className="text-gray-600 mb-6">
              Welcome {preferences?.first_name}! Create a password to secure your account and access your personalized property recommendations.
            </p>

            {/* Preferences Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Your Preferences Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{preferences?.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{preferences?.first_name} {preferences?.last_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Property Type:</span>
                  <span className="ml-2 font-medium">{preferences?.property_type || 'Any'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Budget:</span>
                  <span className="ml-2 font-medium">
                    ${preferences?.price_range_min?.toLocaleString() || '0'} - ${preferences?.price_range_max?.toLocaleString() || 'Any'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Cities:</span>
                  <span className="ml-2 font-medium">
                    {preferences?.city_preferences?.length > 0 ? preferences.city_preferences.join(', ') : 'Any'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Bedrooms:</span>
                  <span className="ml-2 font-medium">{preferences?.bedrooms_needed || 'Any'}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Create Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Re-enter your password"
                  required
                />
              </div>

              {/* Legal Agreements */}
              <div className="space-y-4 border-t pt-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I accept the{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
                      Privacy Policy
                    </Link>
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I would like to receive property updates and newsletters from Wabbit
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !privacyAccepted}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  submitting || !privacyAccepted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Creating Account...' : 'Complete Setup & Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <Link href="/signin" className="text-blue-600 hover:text-blue-800">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <DemoBanner />
    </div>
  )
}
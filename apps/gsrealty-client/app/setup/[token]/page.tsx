'use client';

/**
 * GSRealty Client Account Setup Page
 * Public page - accessed via magic link from invitation email
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface InvitationData {
  valid: boolean;
  invitation: {
    id: string;
    email: string;
    expiresAt: string;
    daysUntilExpiration: number;
    customMessage?: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ClientSetupPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/admin/invites/verify?token=${params.token}`);

      if (response.ok) {
        const data = await response.json();
        setInvitationData(data);
      } else {
        const errorData = await response.json();

        // Provide specific error messages
        if (errorData.code === 'EXPIRED') {
          setError('This invitation has expired. Please contact your agent for a new invitation.');
        } else if (errorData.code === 'USED') {
          setError('This invitation has already been used. Try signing in instead.');
        } else if (errorData.code === 'ACCOUNT_EXISTS') {
          setError('An account already exists for this client. Please sign in.');
        } else {
          setError(errorData.error || 'Invalid or expired invitation link');
        }
      }
    } catch (err) {
      setError('Failed to validate invitation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the terms and privacy policy to continue');
      return;
    }

    if (!invitationData) {
      setError('Invalid invitation data');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const supabase = createClient();

      // 1. Create Supabase auth account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitationData.client.email,
        password: password,
        options: {
          data: {
            first_name: invitationData.client.firstName,
            last_name: invitationData.client.lastName,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        setError(signUpError.message);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account');
        return;
      }

      // 2. Create GSRealty user record
      const { error: userError } = await supabase
        .from('gsrealty_users')
        .insert({
          auth_user_id: authData.user.id,
          email: invitationData.client.email,
          full_name: `${invitationData.client.firstName} ${invitationData.client.lastName}`,
          role: 'client',
        });

      if (userError) {
        console.error('User record error:', userError);
        // Don't block - continue anyway
      }

      // 3. Link client record to user
      const { error: linkError } = await supabase
        .from('gsrealty_clients')
        .update({ user_id: authData.user.id })
        .eq('id', invitationData.client.id);

      if (linkError) {
        console.error('Link client error:', linkError);
        // Don't block - continue anyway
      }

      // 4. Mark invitation as used
      const { error: markError } = await supabase
        .from('gsrealty_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('token', params.token);

      if (markError) {
        console.warn('Could not mark invitation as used:', markError);
        // Don't block - not critical
      }

      // Success!
      setSuccessMessage('Account created successfully! Redirecting to your dashboard...');

      // Auto sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitationData.client.email,
        password: password,
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        // Redirect to login page
        setTimeout(() => {
          router.push('/signin?message=Account created. Please sign in.');
        }, 2000);
      } else {
        // Redirect to client dashboard
        setTimeout(() => {
          router.push('/client/dashboard');
        }, 2000);
      }

    } catch (err) {
      console.error('Setup error:', err);
      setError('An error occurred during setup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  // Error state (no valid invitation)
  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Link
                  href="/signin"
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/"
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center"
                >
                  Return Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Setup form
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">GSRealty</h1>
            <p className="text-gray-600">Client Portal Account Setup</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Welcome Message */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {invitationData?.client.firstName}!
              </h2>
              <p className="text-gray-600">
                Set up your account to access your client portal and view your property information.
              </p>
            </div>

            {/* Custom Message from Admin */}
            {invitationData?.invitation.customMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-900 italic">
                  "{invitationData.invitation.customMessage}"
                </p>
              </div>
            )}

            {/* Client Info Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">
                    {invitationData?.client.firstName} {invitationData?.client.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{invitationData?.client.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Invitation Expires:</span>
                  <span className="font-medium">
                    {invitationData?.invitation.daysUntilExpiration} days
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-6">
                {successMessage}
              </div>
            )}

            {/* Setup Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Field */}
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
                  disabled={submitting}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password Field */}
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
                  disabled={submitting}
                />
              </div>

              {/* Terms Checkbox */}
              <div className="border-t pt-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                    disabled={submitting}
                  />
                  <span className="text-sm text-gray-700">
                    I accept the GSRealty{' '}
                    <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800">
                      Privacy Policy
                    </Link>
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !termsAccepted}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  submitting || !termsAccepted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Creating Your Account...' : 'Complete Setup & Sign In'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <Link href="/signin" className="text-blue-600 hover:text-blue-800">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

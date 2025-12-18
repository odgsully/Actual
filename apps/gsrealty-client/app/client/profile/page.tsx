'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { User, Lock, Bell, Shield } from 'lucide-react'
import { ProfileForm } from '@/components/client/ProfileForm'
import { getClientById } from '@/lib/database/clients'
import type { GSRealtyClient } from '@/lib/database/clients'

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<GSRealtyClient | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile')

  useEffect(() => {
    async function loadClient() {
      if (!user?.id) return

      try {
        const { client: clientData } = await getClientById(user.id)
        setClient(clientData)
      } catch (error) {
        console.error('[Profile] Error loading client:', error)
      } finally {
        setLoading(false)
      }
    }

    loadClient()
  }, [user?.id])

  const handleProfileUpdate = async () => {
    // Reload client data after update
    if (!user?.id) return
    const { client: clientData } = await getClientById(user.id)
    setClient(clientData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-brand-black mb-2">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-3 rounded-lg font-medium
                    transition-colors
                    ${activeTab === tab.id
                      ? 'bg-brand-red text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-brand-black mb-4">
                Profile Information
              </h2>
              <p className="text-gray-600 mb-6">
                Update your personal information. This information will be visible to your agent.
              </p>
              <ProfileForm client={client} onUpdate={handleProfileUpdate} />
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold text-brand-black mb-4">
                Security Settings
              </h2>
              <p className="text-gray-600 mb-6">
                Manage your password and security preferences.
              </p>

              <div className="space-y-6">
                {/* Change Password Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Lock className="w-6 h-6 text-gray-600" />
                    <h3 className="text-lg font-semibold text-brand-black">
                      Change Password
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    To change your password, please contact your agent at{' '}
                    <a href="mailto:gbsullivan@mac.com" className="text-brand-red hover:underline">
                      gbsullivan@mac.com
                    </a>
                  </p>
                </div>

                {/* Account Security */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-6 h-6 text-gray-600" />
                    <h3 className="text-lg font-semibold text-brand-black">
                      Account Security
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Last login:</span>
                      <span className="font-medium text-brand-black">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Account created:</span>
                      <span className="font-medium text-brand-black">
                        {client?.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-brand-black mb-4">
                Notification Preferences
              </h2>
              <p className="text-gray-600 mb-6">
                Choose how you want to receive updates and notifications.
              </p>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-brand-black">Email Notifications</h4>
                    <p className="text-sm text-gray-600">
                      Receive updates about new properties and files
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                  </label>
                </div>

                {/* Property Updates */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-brand-black">Property Updates</h4>
                    <p className="text-sm text-gray-600">
                      Get notified when properties are added or updated
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                  </label>
                </div>

                {/* File Upload Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-brand-black">File Uploads</h4>
                    <p className="text-sm text-gray-600">
                      Be notified when your agent uploads new files
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                  </label>
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-brand-black">Marketing Emails</h4>
                    <p className="text-sm text-gray-600">
                      Receive newsletters and promotional content
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Note: These notification preferences are currently for display purposes only.
                  Actual email notifications will be implemented in a future update.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

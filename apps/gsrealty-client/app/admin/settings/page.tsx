'use client'

import { useState } from 'react'
import { Save, Bell, Lock, Database, Mail } from 'lucide-react'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    clientInviteNotifications: true,
    fileUploadNotifications: false,

    // System settings
    autoArchiveClients: false,
    archiveAfterDays: 90,

    // Email settings
    emailSignature: 'Best regards,\nGS Realty Team',
    replyToEmail: 'support@gsrealty.com',
  })

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSaving(false)
    setSaved(true)

    // Hide success message after 3 seconds
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-black">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and system preferences
        </p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-brand-black">
              Notifications
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Email notifications</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                setSettings({ ...settings, emailNotifications: e.target.checked })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-brand-red"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700">
              Client invitation notifications
            </span>
            <input
              type="checkbox"
              checked={settings.clientInviteNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  clientInviteNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-brand-red"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700">File upload notifications</span>
            <input
              type="checkbox"
              checked={settings.fileUploadNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  fileUploadNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-brand-red"
            />
          </label>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-brand-black">
              System Settings
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Auto-archive inactive clients</span>
            <input
              type="checkbox"
              checked={settings.autoArchiveClients}
              onChange={(e) =>
                setSettings({ ...settings, autoArchiveClients: e.target.checked })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-brand-red"
            />
          </label>
          {settings.autoArchiveClients && (
            <div className="ml-6">
              <label className="block text-sm text-gray-700 mb-2">
                Archive after (days)
              </label>
              <input
                type="number"
                value={settings.archiveAfterDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    archiveAfterDays: parseInt(e.target.value) || 90,
                  })
                }
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-brand-black">
              Email Settings
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply-To Email
            </label>
            <input
              type="email"
              value={settings.replyToEmail}
              onChange={(e) =>
                setSettings({ ...settings, replyToEmail: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Signature
            </label>
            <textarea
              value={settings.emailSignature}
              onChange={(e) =>
                setSettings({ ...settings, emailSignature: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Security - Coming Soon */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-brand-black">Security</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-500">Security settings coming soon...</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-6">
        <div>
          {saved && (
            <p className="text-green-600 font-medium">
              Settings saved successfully!
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  )
}

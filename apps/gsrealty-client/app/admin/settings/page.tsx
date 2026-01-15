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
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/60 mt-2">
          Manage your account and system preferences
        </p>
      </div>

      {/* Notifications */}
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-white">
              Notifications
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-white/80">Email notifications</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                setSettings({ ...settings, emailNotifications: e.target.checked })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-white/40"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-white/80">
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
              className="w-5 h-5 text-brand-red rounded focus:ring-white/40"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-white/80">File upload notifications</span>
            <input
              type="checkbox"
              checked={settings.fileUploadNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  fileUploadNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-white/40"
            />
          </label>
        </div>
      </div>

      {/* System Settings */}
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-white">
              System Settings
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-white/80">Auto-archive inactive clients</span>
            <input
              type="checkbox"
              checked={settings.autoArchiveClients}
              onChange={(e) =>
                setSettings({ ...settings, autoArchiveClients: e.target.checked })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-white/40"
            />
          </label>
          {settings.autoArchiveClients && (
            <div className="ml-6">
              <label className="block text-sm text-white/80 mb-2">
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
                className="w-32 px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* Email Settings */}
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-white">
              Email Settings
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Reply-To Email
            </label>
            <input
              type="email"
              value={settings.replyToEmail}
              onChange={(e) =>
                setSettings({ ...settings, replyToEmail: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email Signature
            </label>
            <textarea
              value={settings.emailSignature}
              onChange={(e) =>
                setSettings({ ...settings, emailSignature: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Security - Coming Soon */}
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-white/50">Security settings coming soon...</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between glass-card p-6">
        <div>
          {saved && (
            <p className="text-green-400 font-medium">
              Settings saved successfully!
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-brand-red text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  )
}

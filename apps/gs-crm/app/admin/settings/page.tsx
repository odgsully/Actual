'use client'

import { useState, useEffect } from 'react'
import { Save, Bell, Lock, Database, Mail, Target, Loader2 } from 'lucide-react'
import {
  getAllSettings,
  updateAllSettings,
  type AllSettings,
  DEFAULT_SETTINGS
} from '@/lib/database/settings'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { settings: loadedSettings, error } = await getAllSettings()
        if (error) {
          console.error('Error loading settings:', error)
          setError('Failed to load settings')
        } else {
          setSettings(loadedSettings)
        }
      } catch (err) {
        console.error('Error loading settings:', err)
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const { success, error } = await updateAllSettings(settings)

      if (!success || error) {
        throw error || new Error('Failed to save settings')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      </div>
    )
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

      {/* Outreach Targets - NEW SECTION */}
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-semibold text-white">
              Outreach Targets
            </h2>
          </div>
          <p className="text-white/50 text-sm mt-1">
            Set your monthly and quarterly outreach activity goals
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Monthly Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.outreach_targets.monthlyTarget}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      outreach_targets: {
                        ...settings.outreach_targets,
                        monthlyTarget: parseInt(e.target.value) || 50
                      }
                    })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-lg font-semibold focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  activities
                </span>
              </div>
              <p className="text-white/40 text-xs mt-2">
                Calls, emails, meetings, texts combined
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Quarterly Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={settings.outreach_targets.quarterlyTarget}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      outreach_targets: {
                        ...settings.outreach_targets,
                        quarterlyTarget: parseInt(e.target.value) || 150
                      }
                    })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-lg font-semibold focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  activities
                </span>
              </div>
              <p className="text-white/40 text-xs mt-2">
                Recommended: 3x your monthly target
              </p>
            </div>
          </div>
        </div>
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
              checked={settings.notifications.emailNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    emailNotifications: e.target.checked
                  }
                })
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
              checked={settings.notifications.clientInviteNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    clientInviteNotifications: e.target.checked
                  }
                })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-white/40"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-white/80">File upload notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications.fileUploadNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    fileUploadNotifications: e.target.checked
                  }
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
              checked={settings.system.autoArchiveClients}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  system: {
                    ...settings.system,
                    autoArchiveClients: e.target.checked
                  }
                })
              }
              className="w-5 h-5 text-brand-red rounded focus:ring-white/40"
            />
          </label>
          {settings.system.autoArchiveClients && (
            <div className="ml-6">
              <label className="block text-sm text-white/80 mb-2">
                Archive after (days)
              </label>
              <input
                type="number"
                value={settings.system.archiveAfterDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    system: {
                      ...settings.system,
                      archiveAfterDays: parseInt(e.target.value) || 90
                    }
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
              value={settings.email.replyToEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  email: {
                    ...settings.email,
                    replyToEmail: e.target.value
                  }
                })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email Signature
            </label>
            <textarea
              value={settings.email.emailSignature}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  email: {
                    ...settings.email,
                    emailSignature: e.target.value
                  }
                })
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
          {error && (
            <p className="text-red-400 font-medium">
              {error}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-brand-red text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-300"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  )
}

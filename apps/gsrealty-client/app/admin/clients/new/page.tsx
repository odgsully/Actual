'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type CreateClientInput } from '@/lib/database/clients'
import { ArrowLeft, Save, User, Phone, Mail, MapPin, FileText } from 'lucide-react'

export default function NewClientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<CreateClientInput>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    property_address: '',
    notes: ''
  })

  const handleChange = (field: keyof CreateClientInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error on change
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.first_name.trim()) {
      setError('First name is required')
      return
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required')
      return
    }

    setSaving(true)

    const { client, error: createError } = await createClient(formData)

    if (createError) {
      setError(createError.message || 'Failed to create client')
      setSaving(false)
      return
    }

    // Success! Redirect to clients list
    router.push('/admin/clients')
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Add New Client</h1>
          <p className="text-white/60 mt-1">Create a new client profile</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-white/80 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-white/80 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Contact Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="john.doe@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Address Information</span>
          </h2>

          <div className="space-y-4">
            {/* Client Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-white/80 mb-2">
                Client Address
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                placeholder="123 Main St, Phoenix, AZ 85001"
              />
            </div>

            {/* Property Address */}
            <div>
              <label htmlFor="property_address" className="block text-sm font-medium text-white/80 mb-2">
                Property Address (Listing/Buying)
              </label>
              <input
                id="property_address"
                type="text"
                value={formData.property_address}
                onChange={(e) => handleChange('property_address', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                placeholder="456 Oak Ave, Scottsdale, AZ 85250"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Notes</span>
          </h2>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-white/80 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors resize-none"
              placeholder="Add any additional notes about this client..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="px-6 py-3 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-brand-red text-white font-semibold rounded-lg hover:bg-brand-red-hover transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Client</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

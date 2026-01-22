'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type CreateClientInput, type ClientType } from '@/lib/database/clients'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Save, User, Phone, Mail, MapPin, FileText, Home, Users, Tag } from 'lucide-react'

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
    client_type: 'buyer',
    notes: ''
  })

  const handleChange = (field: keyof CreateClientInput, value: string | ClientType) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error on change
  }

  const handleClientTypeChange = (type: ClientType) => {
    setFormData(prev => ({ ...prev, client_type: type }))
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

  // Client type configuration
  const typeConfig = {
    buyer: { label: 'Buyer', icon: User, color: 'blue' },
    seller: { label: 'Seller', icon: Home, color: 'pink' },
    both: { label: 'Both', icon: Users, color: 'purple' },
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/clients"
            className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Add New Contact</h1>
            <p className="text-white/60 mt-1">Create a new contact profile</p>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-500/20 border border-red-400/30 p-4">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </Card>
      )}

      {/* Client Type Selection */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Contact Type</span>
          </div>
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
            {(Object.keys(typeConfig) as ClientType[]).map((type) => {
              const config = typeConfig[type]
              const Icon = config.icon
              const isActive = formData.client_type === type

              const activeClasses = {
                buyer: 'bg-blue-500/30 text-blue-400 border-blue-400/50',
                seller: 'bg-pink-500/30 text-pink-400 border-pink-400/50',
                both: 'bg-purple-500/30 text-purple-400 border-purple-400/50',
              }

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleClientTypeChange(type)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-300 border
                    ${isActive ? activeClasses[type] : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'}
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{config.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <p className="text-white/50 text-sm mt-3">
          Properties can be added after creating the contact.
        </p>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-white/80 mb-2">
                First Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-white/80 mb-2">
                Last Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
                placeholder="Doe"
              />
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Phone className="w-5 h-5 text-green-400" />
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
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
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
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Address Information */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-yellow-400" />
            <span>Address Information</span>
          </h2>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-white/80 mb-2">
              Contact Address
            </label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
              placeholder="123 Main St, Phoenix, AZ 85001"
            />
          </div>
        </Card>

        {/* Notes */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-400" />
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
              placeholder="Add any additional notes about this contact..."
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/clients"
            className={`inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors ${saving ? 'opacity-50 pointer-events-none' : ''}`}
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-red hover:bg-brand-red-hover text-white font-semibold transition-all duration-700 ease-out hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Contact
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

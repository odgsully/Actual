'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  getClientById,
  updateClient,
  deleteClient,
  type GSRealtyClient,
  type UpdateClientInput
} from '@/lib/database/clients'
import {
  ArrowLeft,
  Save,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle
} from 'lucide-react'

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<GSRealtyClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState<UpdateClientInput>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    property_address: '',
    notes: ''
  })

  useEffect(() => {
    loadClient()
  }, [clientId])

  const loadClient = async () => {
    setLoading(true)
    const { client: data, error } = await getClientById(clientId)

    if (error) {
      setError('Failed to load client')
      setLoading(false)
      return
    }

    if (!data) {
      setError('Client not found')
      setLoading(false)
      return
    }

    setClient(data)
    setFormData({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      property_address: data.property_address || '',
      notes: data.notes || ''
    })
    setLoading(false)
  }

  const handleChange = (field: keyof UpdateClientInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.first_name?.trim()) {
      setError('First name is required')
      return
    }
    if (!formData.last_name?.trim()) {
      setError('Last name is required')
      return
    }

    setSaving(true)

    const { client: updated, error: updateError } = await updateClient(clientId, formData)

    if (updateError) {
      setError(updateError.message || 'Failed to update client')
      setSaving(false)
      return
    }

    if (updated) {
      setClient(updated)
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { success, error: deleteError } = await deleteClient(clientId)

    if (deleteError) {
      setError(deleteError.message || 'Failed to delete client')
      setDeleting(false)
      setShowDeleteModal(false)
      return
    }

    router.push('/admin/clients')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">{error}</h3>
              <p className="text-sm text-red-600 mt-1">
                The client you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/clients')}
            className="mt-4 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-brand-black">
              {client?.first_name} {client?.last_name}
            </h1>
            <p className="text-gray-600 mt-1">Client Details</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center space-x-2 px-4 py-2 border-2 border-red-600 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-brand-black mb-4 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personal Information</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-600">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-red focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-600">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-red focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-brand-black mb-4 flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Contact Information</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-brand-black mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Address Information</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Client Address
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-red focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="property_address" className="block text-sm font-medium text-gray-700 mb-2">
                Property Address (Listing/Buying)
              </label>
              <input
                id="property_address"
                type="text"
                value={formData.property_address}
                onChange={(e) => handleChange('property_address', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-red focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-brand-black mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Notes</span>
          </h2>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-red focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete {client?.first_name} {client?.last_name}?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this client? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  getClientById,
  updateClient,
  deleteClient,
  type GSRealtyClient,
  type UpdateClientInput,
  type ClientType
} from '@/lib/database/clients'
import {
  getClientProperties,
  addClientProperty,
  updateClientProperty,
  updatePropertyStatus,
  removeClientProperty,
  createDealForProperty,
  type ClientPropertyWithDeal,
  type PropertyType,
  type PropertyStatus
} from '@/lib/database/client-properties'
import { closeDeal } from '@/lib/database/deals'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ClientTypeToggle,
  PropertyCard,
  AddPropertyModal,
  ClientTypeMismatchModal,
  CloseDealConfirmModal
} from '@/components/admin/clients'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  Home,
  Plus,
  Tag,
  Activity,
  Users,
  MessageSquare,
  MoreHorizontal,
  Clock
} from 'lucide-react'
import LogOutreachModal from '@/components/admin/LogOutreachModal'
import { getClientOutreach, type GSRealtyOutreach } from '@/lib/database/outreach'

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  // Client state
  const [client, setClient] = useState<GSRealtyClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Properties state
  const [properties, setProperties] = useState<ClientPropertyWithDeal[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)

  // Outreach/Activity state
  const [outreachHistory, setOutreachHistory] = useState<GSRealtyOutreach[]>([])
  const [loadingOutreach, setLoadingOutreach] = useState(true)
  const [showOutreachModal, setShowOutreachModal] = useState(false)
  const [outreachDefaultType, setOutreachDefaultType] = useState<'call' | 'email' | 'meeting' | 'text' | 'other'>('call')

  // Modal states
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [addPropertyType, setAddPropertyType] = useState<PropertyType>('buying')
  const [showMismatchModal, setShowMismatchModal] = useState(false)
  const [pendingPropertyData, setPendingPropertyData] = useState<{
    address: string
    propertyType: PropertyType
    notes?: string
  } | null>(null)
  const [showCloseDealModal, setShowCloseDealModal] = useState(false)
  const [pendingCloseProperty, setPendingCloseProperty] = useState<{
    propertyId: string
    dealId: string
    dealStage: string
    propertyAddress: string
  } | null>(null)
  const [editingProperty, setEditingProperty] = useState<ClientPropertyWithDeal | null>(null)
  const [editPropertyAddress, setEditPropertyAddress] = useState('')
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false)
  const [savingProperty, setSavingProperty] = useState(false)

  // Form state
  const [formData, setFormData] = useState<UpdateClientInput>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  // Load client data
  useEffect(() => {
    loadClient()
  }, [clientId])

  // Load properties when client is loaded
  useEffect(() => {
    if (client) {
      loadProperties()
      loadOutreach()
    }
  }, [client?.id])

  const loadOutreach = async () => {
    setLoadingOutreach(true)
    const { outreach, error } = await getClientOutreach(clientId, 10)
    if (!error) {
      setOutreachHistory(outreach)
    }
    setLoadingOutreach(false)
  }

  const handleOpenOutreachModal = (type: 'call' | 'email' | 'meeting' | 'text' | 'other') => {
    setOutreachDefaultType(type)
    setShowOutreachModal(true)
  }

  // Helper functions for outreach display
  const getOutreachTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4 text-blue-400" />
      case 'email': return <Mail className="w-4 h-4 text-green-400" />
      case 'meeting': return <Users className="w-4 h-4 text-purple-400" />
      case 'text': return <MessageSquare className="w-4 h-4 text-yellow-400" />
      default: return <MoreHorizontal className="w-4 h-4 text-gray-400" />
    }
  }

  const getOutreachTypeBg = (type: string) => {
    switch (type) {
      case 'call': return 'bg-blue-500/20'
      case 'email': return 'bg-green-500/20'
      case 'meeting': return 'bg-purple-500/20'
      case 'text': return 'bg-yellow-500/20'
      default: return 'bg-gray-500/20'
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatOutcome = (outcome: string | null) => {
    if (!outcome) return null
    return outcome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

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
      notes: data.notes || ''
    })
    setLoading(false)
  }

  const loadProperties = async () => {
    setLoadingProperties(true)
    const { properties: data, error } = await getClientProperties(clientId)
    if (!error) {
      setProperties(data)
    }
    setLoadingProperties(false)
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

  const handleClientTypeChange = async (newType: ClientType) => {
    const { client: updated, error } = await updateClient(clientId, { client_type: newType })
    if (error) {
      throw error
    }
    if (updated) {
      setClient(updated)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { success, error: deleteError } = await deleteClient(clientId)

    if (deleteError) {
      // Check if it's the cascade protection error
      if (deleteError.message?.includes('active deals')) {
        setError('Cannot delete client with active deals. Close or reassign deals first.')
      } else {
        setError(deleteError.message || 'Failed to delete client')
      }
      setDeleting(false)
      setShowDeleteModal(false)
      return
    }

    router.push('/admin/clients')
  }

  // Property actions
  const handleOpenAddProperty = (type: PropertyType) => {
    setAddPropertyType(type)
    setShowAddPropertyModal(true)
  }

  const handleAddProperty = async (address: string, propertyType: PropertyType, notes?: string) => {
    if (!client) return

    // Check for type mismatch
    const isMismatch =
      (client.client_type === 'buyer' && propertyType === 'selling') ||
      (client.client_type === 'seller' && propertyType === 'buying')

    if (isMismatch) {
      setPendingPropertyData({ address, propertyType, notes })
      setShowAddPropertyModal(false)
      setShowMismatchModal(true)
      return
    }

    // Proceed with adding
    const { property, error } = await addClientProperty(clientId, {
      property_address: address,
      property_type: propertyType,
      notes
    })

    if (error) {
      throw error
    }

    // Reload properties
    await loadProperties()
  }

  const handleMismatchConfirm = async () => {
    if (!pendingPropertyData) return

    // First update client type to 'both'
    await handleClientTypeChange('both')

    // Then add the property
    await addClientProperty(clientId, {
      property_address: pendingPropertyData.address,
      property_type: pendingPropertyData.propertyType,
      notes: pendingPropertyData.notes
    })

    setPendingPropertyData(null)
    await loadProperties()
  }

  const handlePropertyStatusChange = async (
    propertyId: string,
    status: PropertyStatus
  ): Promise<{ closeDealPrompt: boolean }> => {
    const { property, closeDealPrompt, error } = await updatePropertyStatus(propertyId, status)

    if (error) {
      console.error('Error updating property status:', error)
      return { closeDealPrompt: false }
    }

    // If closing and has active deal, show confirmation modal
    if (closeDealPrompt && property) {
      const prop = properties.find(p => p.id === propertyId)
      if (prop?.deal) {
        setPendingCloseProperty({
          propertyId,
          dealId: prop.deal.id,
          dealStage: prop.deal.stage,
          propertyAddress: prop.property_address
        })
        setShowCloseDealModal(true)
      }
    }

    await loadProperties()
    return { closeDealPrompt }
  }

  const handleCloseDealConfirm = async () => {
    if (!pendingCloseProperty) return

    await closeDeal(pendingCloseProperty.dealId)
    setPendingCloseProperty(null)
    await loadProperties()
  }

  const handleCloseDealSkip = () => {
    setPendingCloseProperty(null)
  }

  const handleEditProperty = (property: ClientPropertyWithDeal) => {
    setEditingProperty(property)
    setEditPropertyAddress(property.property_address)
    setShowEditPropertyModal(true)
  }

  const handleSavePropertyEdit = async () => {
    if (!editingProperty || !editPropertyAddress.trim()) return

    setSavingProperty(true)
    const { error } = await updateClientProperty(editingProperty.id, {
      property_address: editPropertyAddress.trim()
    })

    if (!error) {
      await loadProperties()
    }

    setSavingProperty(false)
    setShowEditPropertyModal(false)
    setEditingProperty(null)
    setEditPropertyAddress('')
  }

  const handleCloseEditPropertyModal = () => {
    setShowEditPropertyModal(false)
    setEditingProperty(null)
    setEditPropertyAddress('')
  }

  const handleRemoveProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to remove this property?')) return

    const { error } = await removeClientProperty(propertyId)
    if (!error) {
      await loadProperties()
    }
  }

  const handleCreateDealForProperty = async (propertyId: string) => {
    const { error } = await createDealForProperty(propertyId)
    if (error) {
      console.error('Error creating deal for property:', error)
    }
    await loadProperties()
  }

  // Filter properties by type
  const buyingProperties = properties.filter(p => p.property_type === 'buying')
  const sellingProperties = properties.filter(p => p.property_type === 'selling')

  // Determine which sections to show based on client type
  const showBuyingSection = client?.client_type === 'buyer' || client?.client_type === 'both'
  const showSellingSection = client?.client_type === 'seller' || client?.client_type === 'both'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="max-w-3xl space-y-6">
        <Card className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">{error}</h3>
              <p className="text-sm text-white/60 mt-1">
                The contact you&apos;re looking for doesn&apos;t exist or has been deleted.
              </p>
            </div>
          </div>
          <Link
            href="/admin/clients"
            className="inline-flex items-center mt-6 px-6 py-3 bg-brand-red hover:bg-brand-red-hover text-white font-semibold rounded-lg transition-colors"
          >
            Back to Contacts
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/clients"
              className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {client?.first_name} {client?.last_name}
              </h1>
              <p className="text-white/60 mt-1">Contact Details</p>
            </div>
          </div>
          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </Card>

      {/* Client Type Toggle */}
      {client && (
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">Contact Type</span>
            </div>
            <ClientTypeToggle
              value={client.client_type}
              onChange={handleClientTypeChange}
            />
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-500/20 border border-red-400/30 p-4">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </Card>
      )}

      {/* Properties Section - Buying */}
      {showBuyingSection && (
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-400" />
              Properties Interested In (Buying)
            </h2>
            <Button
              onClick={() => handleOpenAddProperty('buying')}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-400/30"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {loadingProperties ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : buyingProperties.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <Home className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No buying properties yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {buyingProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onStatusChange={handlePropertyStatusChange}
                  onEdit={handleEditProperty}
                  onRemove={handleRemoveProperty}
                  onCreateDeal={handleCreateDealForProperty}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Properties Section - Selling */}
      {showSellingSection && (
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-pink-400" />
              Properties Listing (Selling)
            </h2>
            <Button
              onClick={() => handleOpenAddProperty('selling')}
              className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-400/30"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {loadingProperties ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sellingProperties.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No selling properties yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sellingProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onStatusChange={handlePropertyStatusChange}
                  onEdit={handleEditProperty}
                  onRemove={handleRemoveProperty}
                  onCreateDeal={handleCreateDealForProperty}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Activity Section */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Activity
          </h2>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => handleOpenOutreachModal('call')}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-400/30"
              size="sm"
            >
              <Phone className="w-4 h-4 mr-1" />
              Log Call
            </Button>
            <Button
              type="button"
              onClick={() => handleOpenOutreachModal('email')}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-400/30"
              size="sm"
            >
              <Mail className="w-4 h-4 mr-1" />
              Log Email
            </Button>
            <Button
              type="button"
              onClick={() => handleOpenOutreachModal('meeting')}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-400/30"
              size="sm"
            >
              <Users className="w-4 h-4 mr-1" />
              Log Meeting
            </Button>
          </div>
        </div>

        {/* Recent Activity History */}
        {loadingOutreach ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : outreachHistory.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No activity logged yet</p>
            <p className="text-sm mt-1">Use the buttons above to log your first interaction</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outreachHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                {/* Type Icon */}
                <div className={`p-2 rounded-lg ${getOutreachTypeBg(item.type)}`}>
                  {getOutreachTypeIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium capitalize">{item.type}</span>
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>

                  {item.outcome && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded-full">
                      {formatOutcome(item.outcome)}
                    </span>
                  )}

                  {item.notes && (
                    <p className="text-white/60 text-sm mt-1 line-clamp-2">{item.notes}</p>
                  )}

                  {item.duration_minutes && (
                    <span className="text-white/40 text-xs mt-1 block">
                      Duration: {item.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Information */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>Personal Information</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="glass-card max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  Delete {client?.first_name} {client?.last_name}?
                </h3>
                <p className="text-sm text-white/60">
                  Are you sure you want to delete this contact? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="glass-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onSubmit={handleAddProperty}
        defaultPropertyType={addPropertyType}
        clientName={client ? `${client.first_name} ${client.last_name}` : undefined}
      />

      {/* Client Type Mismatch Modal */}
      <ClientTypeMismatchModal
        isOpen={showMismatchModal}
        onClose={() => {
          setShowMismatchModal(false)
          setPendingPropertyData(null)
        }}
        onConfirm={handleMismatchConfirm}
        currentClientType={client?.client_type || 'buyer'}
        attemptedPropertyType={pendingPropertyData?.propertyType || 'buying'}
        clientName={client ? `${client.first_name} ${client.last_name}` : undefined}
      />

      {/* Close Deal Confirm Modal */}
      <CloseDealConfirmModal
        isOpen={showCloseDealModal}
        onClose={() => {
          setShowCloseDealModal(false)
          setPendingCloseProperty(null)
        }}
        onConfirm={handleCloseDealConfirm}
        onSkip={handleCloseDealSkip}
        propertyAddress={pendingCloseProperty?.propertyAddress}
        dealStage={pendingCloseProperty?.dealStage}
      />

      {/* Edit Property Modal */}
      {showEditPropertyModal && editingProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="glass-card max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-4">Edit Property Address</h3>
            <Input
              type="text"
              value={editPropertyAddress}
              onChange={(e) => setEditPropertyAddress(e.target.value)}
              placeholder="Property address"
              className="w-full px-4 py-3 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={handleCloseEditPropertyModal}
                disabled={savingProperty}
                className="glass-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePropertyEdit}
                disabled={savingProperty || !editPropertyAddress.trim()}
                className="bg-brand-red hover:bg-brand-red-hover text-white disabled:opacity-50"
              >
                {savingProperty ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Log Outreach Modal */}
      <LogOutreachModal
        isOpen={showOutreachModal}
        onClose={() => setShowOutreachModal(false)}
        clientId={clientId}
        clientName={client ? `${client.first_name} ${client.last_name}` : undefined}
        defaultType={outreachDefaultType}
        onSuccess={() => {
          loadOutreach()
        }}
      />
    </div>
  )
}

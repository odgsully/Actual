'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAllClients,
  searchClients,
  deleteClient,
  type GSRealtyClient,
  type ClientType,
  type ClientStatus
} from '@/lib/database/clients'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  AlertCircle,
  Users,
  Eye,
  EyeOff
} from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<GSRealtyClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set())

  // Load clients on mount
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    const { clients: data, error } = await getAllClients()
    if (error) {
      console.error('Error loading clients:', error)
    } else {
      setClients(data || [])
    }
    setLoading(false)
  }

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      loadClients()
      return
    }

    setLoading(true)
    const { clients: data, error } = await searchClients(query)
    if (error) {
      console.error('Error searching clients:', error)
    } else {
      setClients(data || [])
    }
    setLoading(false)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    setDeleting(true)
    const { success, error } = await deleteClient(id)

    if (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client')
    } else {
      // Remove from local state
      setClients(prev => prev.filter(c => c.id !== id))
    }

    setDeleting(false)
    setDeleteConfirm(null)
  }

  // Toggle reveal for a specific contact
  const toggleReveal = (contactId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setRevealedContacts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
  }

  // Mask email for privacy
  const maskEmail = (email: string | null | undefined): string => {
    if (!email) return 'No email'
    const [local, domain] = email.split('@')
    if (!domain) return '•••@•••'
    const maskedLocal = local.charAt(0) + '•••'
    return `${maskedLocal}@${domain}`
  }

  // Mask phone for privacy
  const maskPhone = (phone: string | null | undefined): string => {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 4) return '•••-••••'
    return `•••-•••-${digits.slice(-4)}`
  }

  // Get display label for client status (stored in database)
  const getStatusDisplay = (status: ClientStatus): { label: string; style: string } => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          style: 'bg-green-500/20 text-green-400 border-green-400/30'
        }
      case 'prospect':
        return {
          label: 'Prospect',
          style: 'bg-blue-500/20 text-blue-400 border-blue-400/30'
        }
      case 'inactive':
      default:
        return {
          label: 'Inactive',
          style: 'bg-gray-500/20 text-gray-400 border-gray-400/30'
        }
    }
  }

  // Get client type badge styling
  const getClientTypeBadge = (clientType: ClientType) => {
    const styles = {
      buyer: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
      seller: 'bg-pink-500/20 text-pink-400 border-pink-400/30',
      both: 'bg-purple-500/20 text-purple-400 border-purple-400/30',
    }
    const labels = {
      buyer: 'Buyer',
      seller: 'Seller',
      both: 'Both',
    }
    return { style: styles[clientType] || styles.buyer, label: labels[clientType] || 'Buyer' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Contacts</h1>
              <p className="text-white/60 mt-1">
                Manage contact information and details
              </p>
            </div>
          </div>
          <Link
            href="/admin/clients/new"
            className="inline-flex items-center px-6 py-3 bg-brand-red hover:bg-brand-red-hover text-white font-semibold rounded-lg transition-all duration-700 ease-out hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Contact
          </Link>
        </div>
      </Card>

      {/* Search Bar */}
      <Card className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
          />
        </div>
      </Card>

      {/* Clients List */}
      <Card className="glass-card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No contacts yet
            </h3>
            <p className="text-white/60 mb-6">
              Get started by adding your first contact
            </p>
            <Link
              href="/admin/clients/new"
              className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-all duration-700 ease-out hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add First Contact
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/10">
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Client Rows */}
            {clients.map((client) => {
              const initials = `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`.toUpperCase()
              const statusDisplay = getStatusDisplay(client.status)
              const isRevealed = revealedContacts.has(client.id)
              const hasContactInfo = client.email || client.phone

              return (
                <div
                  key={client.id}
                  className="group bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 p-4"
                >
                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    {/* Name */}
                    <div className="col-span-4 flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-brand-red/20 text-brand-red text-sm font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">
                          {client.first_name} {client.last_name}
                        </p>
                        {client.notes && (
                          <p className="text-sm text-white/50 truncate max-w-[200px]">
                            {client.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-white/40" />
                          <span className="text-sm text-white/80">
                            {isRevealed ? (client.email || 'No email') : maskEmail(client.email)}
                          </span>
                          {hasContactInfo && (
                            <button
                              onClick={(e) => toggleReveal(client.id, e)}
                              className="p-1 rounded-md hover:bg-white/10 transition-colors"
                              title={isRevealed ? 'Hide' : 'Reveal'}
                            >
                              {isRevealed ? (
                                <EyeOff className="h-3.5 w-3.5 text-white/40" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 text-white/40" />
                              )}
                            </button>
                          )}
                        </div>
                        {client.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-white/40" />
                            <span className="text-sm text-white/80">
                              {isRevealed ? client.phone : maskPhone(client.phone)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      {(() => {
                        const typeBadge = getClientTypeBadge(client.client_type)
                        return (
                          <Badge className={`text-xs ${typeBadge.style}`}>
                            {typeBadge.label}
                          </Badge>
                        )
                      })()}
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <Badge className={`text-xs ${statusDisplay.style}`}>
                        {statusDisplay.label}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => router.push(`/admin/clients/${client.id}`)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-white/60 hover:text-white" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(client.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-brand-red/20 text-brand-red text-sm font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">
                            {client.first_name} {client.last_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const typeBadge = getClientTypeBadge(client.client_type)
                              return (
                                <Badge className={`text-xs ${typeBadge.style}`}>
                                  {typeBadge.label}
                                </Badge>
                              )
                            })()}
                            <Badge className={`text-xs ${statusDisplay.style}`}>
                              {statusDisplay.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-white/60" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(client.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center space-x-2 text-white/60">
                        <Mail className="w-4 h-4" />
                        <span>{client.email || 'No email'}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center space-x-2 text-white/60">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="glass-card max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  Delete Contact?
                </h3>
                <p className="text-sm text-white/60">
                  Are you sure you want to delete this contact? This action cannot be undone.
                  All associated properties and files will also be removed.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="glass-button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
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

      {/* Contact Count */}
      <div className="text-center text-sm text-white/50">
        {clients.length} {clients.length === 1 ? 'contact' : 'contacts'} total
      </div>
    </div>
  )
}

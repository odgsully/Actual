'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAllClients,
  searchClients,
  deleteClient,
  type GSRealtyClient
} from '@/lib/database/clients'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle
} from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<GSRealtyClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage client information and contacts
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/clients/new')}
          className="flex items-center space-x-2 px-6 py-3 bg-brand-red text-white font-semibold rounded-lg hover:bg-brand-red-hover transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-red focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No clients yet
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by adding your first client
            </p>
            <button
              onClick={() => router.push('/admin/clients/new')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-black text-white font-semibold rounded-lg hover:bg-brand-gray-dark transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Client</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Property Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-brand-red rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {client.first_name} {client.last_name}
                          </div>
                          {client.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {client.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {!client.email && !client.phone && (
                          <span className="text-sm text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.property_address ? (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-xs">{client.property_address}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No property</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(client.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Client?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this client? This action cannot be undone.
                  All associated properties and files will also be removed.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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

      {/* Client Count */}
      <div className="text-center text-sm text-gray-500">
        {clients.length} {clients.length === 1 ? 'client' : 'clients'} total
      </div>
    </div>
  )
}

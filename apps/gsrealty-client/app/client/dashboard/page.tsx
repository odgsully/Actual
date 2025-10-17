'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Building2, FileText, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getUserProperties } from '@/lib/database/properties'
import { getClientFiles } from '@/lib/database/files'
import { getClientById } from '@/lib/database/clients'
import type { GSRealtyClient } from '@/lib/database/clients'
import type { UploadedFile } from '@/lib/types/storage'

interface Property {
  id: string
  address: string
  city?: string
  state?: string
  zip?: string
  price?: number
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  status?: string
  image_url?: string
  is_favorite?: boolean
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<GSRealtyClient | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [files, setFiles] = useState<UploadedFile[]>([])

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) return

      try {
        // Get client info
        const { client: clientData } = await getClientById(user.id)
        if (clientData) setClient(clientData)

        // Get properties
        const userProperties = await getUserProperties(user.id)
        setProperties(userProperties.slice(0, 4)) // Show first 4 properties

        // Get files
        const { files: clientFiles } = await getClientFiles(user.id)
        setFiles(clientFiles.slice(0, 5)) // Show first 5 files
      } catch (error) {
        console.error('[Client Dashboard] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const userName = client
    ? `${client.first_name} ${client.last_name}`
    : user?.email?.split('@')[0] || 'Client'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-brand-black mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your properties and recent activity.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* My Properties */}
        <Link
          href="/client/properties"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-brand-black mb-1">{properties.length}</h3>
          <p className="text-sm text-gray-600">My Properties</p>
        </Link>

        {/* Files */}
        <Link
          href="/client/files"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-brand-black mb-1">{files.length}</h3>
          <p className="text-sm text-gray-600">Uploaded Files</p>
        </Link>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-brand-black mb-1">
            {files.filter(f => {
              const uploadDate = new Date(f.upload_date)
              const sevenDaysAgo = new Date()
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
              return uploadDate > sevenDaysAgo
            }).length}
          </h3>
          <p className="text-sm text-gray-600">Recent Updates</p>
        </div>

        {/* Quick Action */}
        <Link
          href="/client/profile"
          className="bg-gradient-to-br from-brand-red to-red-700 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1">Profile</h3>
          <p className="text-sm text-white/90">Update Settings</p>
        </Link>
      </div>

      {/* Property Highlights */}
      {properties.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-brand-black">Property Highlights</h2>
            <Link
              href="/client/properties"
              className="text-sm text-brand-red hover:underline font-medium"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Property Image */}
                <div className="h-40 bg-gray-200 flex items-center justify-center">
                  {property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Property Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-brand-black mb-1 text-sm">
                    {property.address}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {property.city}, {property.state} {property.zip}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{property.bedrooms || 0} beds</span>
                    <span>{property.bathrooms || 0} baths</span>
                    <span>{property.square_feet?.toLocaleString() || 0} sqft</span>
                  </div>
                  {property.status && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {property.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Files */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-brand-black">Recent Files</h2>
            <Link
              href="/client/files"
              className="text-sm text-brand-red hover:underline font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-brand-black">{file.file_name}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(file.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {(file.file_size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {properties.length === 0 && files.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Welcome to Your Portal
          </h3>
          <p className="text-gray-600 mb-4">
            Your properties and files will appear here once your agent uploads them.
          </p>
          <p className="text-sm text-gray-500">
            Contact your agent if you have any questions.
          </p>
        </div>
      )}
    </div>
  )
}

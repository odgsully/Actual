'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { CreateEventModal } from '@/components/admin/CreateEventModal'
import {
  Home,
  Upload,
  Search,
  Settings,
  Users,
  TrendingUp,
  FileText,
  CheckCircle,
  Plus
} from 'lucide-react'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)

  const stats = [
    {
      name: 'Total Clients',
      value: '0',
      icon: Users,
      color: 'bg-blue-500',
      change: 'No clients yet'
    },
    {
      name: 'Properties Tracked',
      value: '0',
      icon: Home,
      color: 'bg-green-500',
      change: 'Add your first client'
    },
    {
      name: 'Files Uploaded',
      value: '0',
      icon: FileText,
      color: 'bg-purple-500',
      change: 'Upload MLS data'
    },
    {
      name: 'MCAO Lookups',
      value: '0',
      icon: Search,
      color: 'bg-orange-500',
      change: 'Search properties'
    },
  ]

  const quickActions = [
    {
      title: 'Add New Client',
      description: 'Create a new client profile',
      icon: Users,
      href: '/admin/clients/new',
      color: 'bg-brand-black'
    },
    {
      title: 'Upload MLS Data',
      description: 'Process MLS comps and generate reports',
      icon: Upload,
      href: '/admin/upload',
      color: 'bg-brand-red'
    },
    {
      title: 'MCAO Property Search',
      description: 'Look up Maricopa County property data',
      icon: Search,
      href: '/admin/mcao',
      color: 'bg-brand-black'
    },
    {
      title: 'System Settings',
      description: 'Configure app preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-700'
    },
  ]

  const features = [
    { name: 'Client Management', description: 'Add, edit, and manage client profiles', icon: Users },
    { name: 'MLS Data Processing', description: 'Upload and process MLS comp data', icon: Upload },
    { name: 'MCAO Integration', description: 'Search Maricopa County property records', icon: Search },
    { name: 'File Management', description: 'Store and organize client documents', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border-2 border-brand-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-black mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'Admin'}!
            </h1>
            <p className="text-gray-600">
              Manage your clients, properties, and MLS data all in one place.
            </p>
          </div>
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="px-6 py-3 bg-brand-red text-white rounded-lg hover:bg-red-700 font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-brand-red transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-brand-black mb-1">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.name}
              </p>
              <p className="text-xs text-gray-400">{stat.change}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-brand-black mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <a
                key={action.title}
                href={action.href}
                className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-brand-red transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${action.color} rounded-lg p-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-brand-black mb-2 group-hover:text-brand-red transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
              </a>
            )
          })}
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-lg border-2 border-brand-black p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-brand-red rounded-lg p-2">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-black">
              Available Features
            </h2>
            <p className="text-sm text-gray-600">
              Everything you need to manage your real estate clients
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.name}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="bg-brand-red rounded-lg p-2 flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-black mb-1">
                    {feature.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Getting Started:</span> Begin by adding your first client, then upload their MLS data to start generating reports.
          </p>
        </div>
      </div>

      {/* Event Creation Modal */}
      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onEventCreated={() => {
          // Optionally refresh data or show success message
          console.log('Event created successfully')
        }}
      />
    </div>
  )
}

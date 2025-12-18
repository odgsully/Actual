'use client'

import { useAuth } from '@/hooks/useAuth'
import {
  Home,
  Upload,
  Search,
  Settings,
  Users,
  TrendingUp,
  FileText,
  CheckCircle
} from 'lucide-react'

export default function AdminDashboard() {
  const { user } = useAuth()

  const stats = [
    {
      name: 'Total Clients',
      value: '0',
      icon: Users,
      color: 'bg-blue-500',
      change: 'Coming in Week 2'
    },
    {
      name: 'Properties Tracked',
      value: '0',
      icon: Home,
      color: 'bg-green-500',
      change: 'Coming in Week 2'
    },
    {
      name: 'Files Uploaded',
      value: '0',
      icon: FileText,
      color: 'bg-purple-500',
      change: 'Coming in Week 3'
    },
    {
      name: 'MCAO Lookups',
      value: '0',
      icon: Search,
      color: 'bg-orange-500',
      change: 'Coming in Week 5'
    },
  ]

  const quickActions = [
    {
      title: 'Add New Client',
      description: 'Create a new client profile',
      icon: Users,
      href: '/admin/clients/new',
      color: 'bg-brand-black',
      badge: 'Week 2'
    },
    {
      title: 'Upload MLS Data',
      description: 'Process MLS comps and generate reports',
      icon: Upload,
      href: '/admin/upload',
      color: 'bg-brand-red',
      badge: 'Week 3'
    },
    {
      title: 'MCAO Property Search',
      description: 'Look up Maricopa County property data',
      icon: Search,
      href: '/admin/mcao',
      color: 'bg-brand-black',
      badge: 'Week 5'
    },
    {
      title: 'System Settings',
      description: 'Configure app preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-700',
      badge: 'Later'
    },
  ]

  const developmentProgress = [
    { phase: 'Week 1: Foundation & Auth', status: 'completed', progress: 100 },
    { phase: 'Week 2: Client Management', status: 'next', progress: 0 },
    { phase: 'Week 3: File Upload System', status: 'upcoming', progress: 0 },
    { phase: 'Week 4: Integration & Testing', status: 'upcoming', progress: 0 },
    { phase: 'Week 5: MCAO Integration', status: 'upcoming', progress: 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border-2 border-brand-black p-6">
        <h1 className="text-3xl font-bold text-brand-black mb-2">
          Welcome back, {user?.email?.split('@')[0] || 'Admin'}!
        </h1>
        <p className="text-gray-600">
          Manage your clients, properties, and MLS data all in one place.
        </p>
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
              <div
                key={action.title}
                className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-brand-black transition-colors cursor-not-allowed opacity-75"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${action.color} rounded-lg p-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium">
                    {action.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-brand-black mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Development Roadmap */}
      <div className="bg-white rounded-lg border-2 border-brand-black p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-brand-red rounded-lg p-2">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-black">
              Development Progress
            </h2>
            <p className="text-sm text-gray-600">
              Conservative 10-week timeline
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {developmentProgress.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {item.status === 'completed' ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                ) : item.status === 'next' ? (
                  <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm">
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    item.status === 'completed' ? 'text-green-600' :
                    item.status === 'next' ? 'text-brand-red' :
                    'text-gray-600'
                  }`}>
                    {item.phase}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'next' ? 'bg-brand-red' :
                      'bg-gray-300'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-semibold">✓ Week 1 Complete:</span> Authentication system, role-based protection, and admin dashboard are live!
          </p>
          <p className="text-xs text-green-600 mt-1">
            Next up: Client Management (Week 2) - CRUD operations, client list, and profile management
          </p>
        </div>
      </div>
    </div>
  )
}

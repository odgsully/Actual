'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  TrendingUp,
  DollarSign,
  Phone,
  Search,
  Plus,
  Bell,
  Filter,
  Download,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { getClientCount, getAllClients } from '@/lib/database/clients'
import { getActiveDealsCount, getTotalRevenue, getClientDealValue } from '@/lib/database/deals'
import { getCallsThisMonth, getOutreachThisMonth, getOutreachThisQuarter } from '@/lib/database/outreach'

// Type for client data
interface RecentContact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  created_at: string
  status: 'Active' | 'Prospect' | 'Inactive'
  value: string
}

export default function AdminDashboard() {
  const [statsLoading, setStatsLoading] = useState(true)
  const [contactsLoading, setContactsLoading] = useState(true)
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set())
  const [dashboardStats, setDashboardStats] = useState({
    totalContacts: 0,
    activeDeals: 0,
    revenue: '$0',
    callsPlaced: 0
  })
  const [salesTarget, setSalesTarget] = useState({
    monthlyTarget: 50,
    monthlyAchieved: 0,
    quarterlyTarget: 150,
    quarterlyAchieved: 0
  })

  // Helper to determine contact status based on created_at
  const getContactStatus = (createdAt: string): 'Active' | 'Prospect' | 'Inactive' => {
    const now = new Date()
    const created = new Date(createdAt)
    const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceCreation <= 7) return 'Prospect'
    if (daysSinceCreation <= 30) return 'Active'
    return 'Inactive'
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
  const maskEmail = (email: string | null): string => {
    if (!email) return 'No email'
    const [local, domain] = email.split('@')
    if (!domain) return '•••@•••'
    const maskedLocal = local.charAt(0) + '•••'
    return `${maskedLocal}@${domain}`
  }

  // Mask phone for privacy
  const maskPhone = (phone: string | null): string => {
    if (!phone) return ''
    // Show last 4 digits only
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 4) return '•••-••••'
    return `•••-•••-${digits.slice(-4)}`
  }

  // Fetch real data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all stats in parallel
        const [
          { count: contactCount },
          { count: dealsCount },
          { revenue },
          { count: callsCount },
          { count: monthlyOutreach },
          { count: quarterlyOutreach },
          { clients }
        ] = await Promise.all([
          getClientCount(),
          getActiveDealsCount(),
          getTotalRevenue(),
          getCallsThisMonth(),
          getOutreachThisMonth(),
          getOutreachThisQuarter(),
          getAllClients()
        ])

        // Format revenue for display
        const formattedRevenue = revenue >= 1000
          ? `$${(revenue / 1000).toFixed(1)}K`
          : `$${revenue.toFixed(0)}`

        setDashboardStats({
          totalContacts: contactCount || 0,
          activeDeals: dealsCount || 0,
          revenue: formattedRevenue,
          callsPlaced: callsCount || 0
        })

        setSalesTarget(prev => ({
          ...prev,
          monthlyAchieved: monthlyOutreach || 0,
          quarterlyAchieved: quarterlyOutreach || 0
        }))

        // Fetch recent contacts with real deal values
        if (clients) {
          const sortedClients = clients
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)

          // Fetch deal values for each client
          const recentWithValues = await Promise.all(
            sortedClients.map(async (client) => {
              const { value } = await getClientDealValue(client.id)
              return {
                id: client.id,
                first_name: client.first_name,
                last_name: client.last_name,
                email: client.email ?? null,
                phone: client.phone ?? null,
                created_at: client.created_at,
                status: getContactStatus(client.created_at),
                value: value > 0
                  ? (value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value.toFixed(0)}`)
                  : '$0'
              }
            })
          )
          setRecentContacts(recentWithValues)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setStatsLoading(false)
        setContactsLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = [
    {
      name: 'Total Contacts',
      value: statsLoading ? '...' : dashboardStats.totalContacts.toLocaleString(),
      icon: Users,
      color: 'text-blue-400',
      change: '+12%'
    },
    {
      name: 'Active Deals',
      value: dashboardStats.activeDeals.toString(),
      icon: TrendingUp,
      color: 'text-green-400',
      change: '+8%'
    },
    {
      name: 'Revenue',
      value: dashboardStats.revenue,
      icon: DollarSign,
      color: 'text-yellow-400',
      change: '+23%'
    },
    {
      name: 'Calls Placed',
      value: dashboardStats.callsPlaced.toString(),
      icon: Phone,
      color: 'text-purple-400',
      change: '+15%'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Dashboard</h2>
            <p className="text-white/60">
              Welcome back! Here's your CRM overview
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
              <Input
                className="pl-10 w-64 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 rounded-xl"
                placeholder="Search contacts..."
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              asChild
              className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white transition-all duration-700 ease-out hover:scale-[1.02]"
            >
              <Link href="/admin/clients/new" className="inline-flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid - 4 cards matching template */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.name}
              className="glass-card p-6 transition-all duration-700 ease-out hover:scale-[1.02] hover:bg-white/15"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">{stat.name}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Contacts and Sales Target cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contacts Card */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Contacts</h3>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {contactsLoading ? (
              <p className="text-white/50 text-sm text-center py-8">
                Loading contacts...
              </p>
            ) : recentContacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/50 text-sm mb-4">No contacts yet</p>
                <Button asChild size="sm" className="glass-button">
                  <Link href="/admin/clients/new" className="inline-flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first contact
                  </Link>
                </Button>
              </div>
            ) : (
              recentContacts.map((contact) => {
                const initials = `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase()
                const fullName = `${contact.first_name} ${contact.last_name}`
                const isRevealed = revealedContacts.has(contact.id)
                const hasContactInfo = contact.email || contact.phone

                return (
                  <Link
                    key={contact.id}
                    href={`/admin/clients/${contact.id}`}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-white/20 text-white text-sm font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm">{fullName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-white/60">
                                {isRevealed
                                  ? `${contact.email || 'No email'}${contact.phone ? ` • ${contact.phone}` : ''}`
                                  : `${maskEmail(contact.email)}${contact.phone ? ` • ${maskPhone(contact.phone)}` : ''}`
                                }
                              </p>
                              {hasContactInfo && (
                                <button
                                  onClick={(e) => toggleReveal(contact.id, e)}
                                  className="p-1 rounded-md hover:bg-white/10 transition-colors duration-200"
                                  title={isRevealed ? 'Hide contact info' : 'Reveal contact info'}
                                >
                                  {isRevealed ? (
                                    <EyeOff className="h-3.5 w-3.5 text-white/40 hover:text-white/70" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-white/40 hover:text-white/70" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-white text-sm">{contact.value}</p>
                            <Badge
                              className={`text-xs ${
                                contact.status === 'Active'
                                  ? 'bg-green-500/20 text-green-400 border-green-400/30'
                                  : contact.status === 'Prospect'
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                                    : 'bg-gray-500/20 text-gray-400 border-gray-400/30'
                              }`}
                            >
                              {contact.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </Card>

        {/* Sales Target Card */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Outreach Target</h3>
            <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-6">
            {/* Monthly Target */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80 text-sm">Monthly Outreach</span>
                <span className="text-white font-semibold">{salesTarget.monthlyTarget}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
                  style={{ width: `${Math.min((salesTarget.monthlyAchieved / salesTarget.monthlyTarget) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">{salesTarget.monthlyAchieved} completed</span>
                <span className="text-white/60">{Math.round((salesTarget.monthlyAchieved / salesTarget.monthlyTarget) * 100)}%</span>
              </div>
            </div>

            {/* Quarterly Target */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80 text-sm">Quarterly Outreach</span>
                <span className="text-white font-semibold">{salesTarget.quarterlyTarget}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                  style={{ width: `${Math.min((salesTarget.quarterlyAchieved / salesTarget.quarterlyTarget) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">{salesTarget.quarterlyAchieved} completed</span>
                <span className="text-white/60">{Math.round((salesTarget.quarterlyAchieved / salesTarget.quarterlyTarget) * 100)}%</span>
              </div>
            </div>

            {/* Days Remaining */}
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()}
              </p>
              <p className="text-white/60 text-sm">Days left in month</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

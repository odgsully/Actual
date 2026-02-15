'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Search,
  Trophy,
  DollarSign,
  Home,
  TrendingUp,
  CheckCircle,
  Calendar,
  Briefcase,
  Crown,
  Medal,
  Award,
} from 'lucide-react'
import {
  getClosedDeals,
  getTopClosedDeals,
  getClosedDealsStats,
  type DealWithClient,
} from '@/lib/database/deals'

export default function DealsPage() {
  const [deals, setDeals] = useState<DealWithClient[]>([])
  const [topDeals, setTopDeals] = useState<DealWithClient[]>([])
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    totalCommission: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)

    // Load all data in parallel
    const [dealsResult, topDealsResult, statsResult] = await Promise.all([
      getClosedDeals(searchQuery),
      getTopClosedDeals(3),
      getClosedDealsStats(),
    ])

    setDeals(dealsResult.deals)
    setTopDeals(topDealsResult.deals)
    setStats(statsResult.stats)
    setLoading(false)
  }, [searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Debounced search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toLocaleString()}`
  }

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getClientName = (deal: DealWithClient) => {
    if (!deal.client) return 'Unknown Client'
    return `${deal.client.first_name} ${deal.client.last_name}`
  }

  const getClientInitials = (deal: DealWithClient) => {
    if (!deal.client) return '??'
    return `${deal.client.first_name.charAt(0)}${deal.client.last_name.charAt(0)}`.toUpperCase()
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-400" />
      case 1:
        return <Medal className="w-5 h-5 text-gray-300" />
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBgStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border-yellow-400/30'
      case 1:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-300/10 border-gray-400/30'
      case 2:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-500/10 border-amber-500/30'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Closed Deals</h1>
              <p className="text-white/60 mt-1">
                View your completed transactions and top performers
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Closed</p>
              <p className="text-2xl font-bold text-white">{stats.totalDeals}</p>
            </div>
            <Briefcase className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Volume</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <Home className="h-8 w-8 text-blue-400" />
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Commission</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalCommission)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Top 3 Deals Section */}
      {topDeals.length > 0 && (
        <Card className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Top Deals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topDeals.map((deal, index) => (
              <div
                key={deal.id}
                className={`relative p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${getRankBgStyle(index)}`}
              >
                {/* Rank Badge */}
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  {getRankIcon(index)}
                </div>

                <div className="space-y-3">
                  {/* Client Info */}
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-brand-red/20 text-brand-red text-sm font-medium">
                        {getClientInitials(deal)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">{getClientName(deal)}</p>
                      <Badge
                        className={`text-xs ${
                          deal.type === 'buyer'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                            : 'bg-pink-500/20 text-pink-400 border-pink-400/30'
                        }`}
                      >
                        {deal.type === 'buyer' ? 'Buyer' : 'Seller'}
                      </Badge>
                    </div>
                  </div>

                  {/* Property Address */}
                  {deal.property_address && (
                    <p className="text-sm text-white/70 truncate">
                      {deal.property_address}
                    </p>
                  )}

                  {/* Financial Info */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Commission</span>
                      <span className="text-lg font-bold text-green-400">
                        {formatFullCurrency(deal.expected_commission)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-white/60 text-xs">Deal Value</span>
                      <span className="text-white/80 text-sm">
                        {formatFullCurrency(deal.deal_value)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by client name or property address..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
          />
        </div>
      </Card>

      {/* All Closed Deals List */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">All Closed Deals</h2>
          <span className="text-sm text-white/60">{deals.length} deals</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'No deals found' : 'No closed deals yet'}
            </h3>
            <p className="text-white/60">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Closed deals will appear here once transactions are completed'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/10">
              <div className="col-span-3">Client</div>
              <div className="col-span-3">Property</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Deal Value</div>
              <div className="col-span-2 text-right">Commission</div>
            </div>

            {/* Deal Rows */}
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="group bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 p-4"
              >
                {/* Desktop View */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  {/* Client */}
                  <div className="col-span-3 flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-brand-red/20 text-brand-red text-sm font-medium">
                        {getClientInitials(deal)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">{getClientName(deal)}</p>
                      <p className="text-xs text-white/50">
                        Closed {formatDate(deal.updated_at)}
                      </p>
                    </div>
                  </div>

                  {/* Property */}
                  <div className="col-span-3">
                    <p className="text-sm text-white/80 truncate">
                      {deal.property_address || 'No address'}
                    </p>
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <Badge
                      className={`text-xs ${
                        deal.type === 'buyer'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                          : 'bg-pink-500/20 text-pink-400 border-pink-400/30'
                      }`}
                    >
                      {deal.type === 'buyer' ? 'Buyer' : 'Seller'}
                    </Badge>
                  </div>

                  {/* Deal Value */}
                  <div className="col-span-2 text-right">
                    <p className="font-medium text-white">
                      {formatFullCurrency(deal.deal_value)}
                    </p>
                  </div>

                  {/* Commission */}
                  <div className="col-span-2 text-right">
                    <p className="font-bold text-green-400">
                      {formatFullCurrency(deal.expected_commission)}
                    </p>
                    <p className="text-xs text-white/50">
                      {((deal.commission_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-brand-red/20 text-brand-red text-sm font-medium">
                          {getClientInitials(deal)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">{getClientName(deal)}</p>
                        <Badge
                          className={`text-xs ${
                            deal.type === 'buyer'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                              : 'bg-pink-500/20 text-pink-400 border-pink-400/30'
                          }`}
                        >
                          {deal.type === 'buyer' ? 'Buyer' : 'Seller'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">
                        {formatFullCurrency(deal.expected_commission)}
                      </p>
                      <p className="text-xs text-white/50">commission</p>
                    </div>
                  </div>
                  {deal.property_address && (
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                      <Home className="w-4 h-4" />
                      <span className="truncate">{deal.property_address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>Deal Value: {formatFullCurrency(deal.deal_value)}</span>
                    <span>Closed {formatDate(deal.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Total Count */}
      <div className="text-center text-sm text-white/50">
        {deals.length} {deals.length === 1 ? 'deal' : 'deals'} shown
      </div>
    </div>
  )
}

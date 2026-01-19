'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Home, DollarSign, TrendingUp } from 'lucide-react'
import { PipelineBoard } from '@/components/admin/pipeline'
import { getPipelineStats, type DealType } from '@/lib/database/pipeline'
import Link from 'next/link'

type FilterType = 'all' | 'buyer' | 'seller'

export default function PipelinePage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    totalCommission: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const type = filter === 'all' ? undefined : filter
      const { stats: data } = await getPipelineStats(type)
      setStats({
        total: data.total,
        totalValue: data.totalValue,
        totalCommission: data.totalCommission,
      })
    }
    fetchStats()
  }, [filter])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Sales Pipeline</h2>
            <p className="text-white/60">
              Drag and drop deals between stages
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Filter Toggle */}
            <div className="flex items-center bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filter === 'all'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('buyer')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filter === 'buyer'
                    ? 'bg-blue-500/30 text-blue-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Buyers
              </button>
              <button
                onClick={() => setFilter('seller')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filter === 'seller'
                    ? 'bg-pink-500/30 text-pink-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Sellers
              </button>
            </div>

            {/* Add Deal Button */}
            <Button
              asChild
              className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white transition-all duration-700 ease-out hover:scale-[1.02]"
            >
              <Link href="/admin/deals/new" className="inline-flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add Deal
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Deals</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Pipeline Value</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <Home className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Expected Commission</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalCommission)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Pipeline Board */}
      <PipelineBoard
        dealType={filter}
        onDealClick={(deal) => {
          // TODO: Open deal detail modal or navigate to deal page
          console.log('Deal clicked:', deal)
        }}
      />
    </div>
  )
}

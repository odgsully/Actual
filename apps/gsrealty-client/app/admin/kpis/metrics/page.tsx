'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AnalyticsAreaChart,
  AnalyticsBarChart,
  AnalyticsDonutChart,
  TimePeriodFilter,
  CHART_COLORS,
} from '@/components/admin/analytics'
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Briefcase,
  Clock,
  Award,
  Activity,
  UserPlus,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type { TimePeriod, DateRange } from '@/lib/database/analytics'
import { getRevenueTrend, getDealsByStage } from '@/lib/database/analytics'
import {
  getMetricsKPISummary,
  getWinLossStats,
  getPipelineVelocity,
  getLeadSourceAttribution,
} from '@/lib/database/kpis'

// Format currency
const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toFixed(0)}`
}

// Stat card component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  subtitle,
}: {
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  subtitle?: string
}) {
  return (
    <Card className="glass-card p-6 transition-all duration-700 ease-out hover:scale-[1.02] hover:bg-white/15">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {change >= 0 ? (
                <ArrowUp className="h-3 w-3 text-green-400" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-400" />
              )}
              <span className={change >= 0 ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                {Math.abs(change)}%
              </span>
              <span className="text-white/40 text-sm">vs prev</span>
            </div>
          )}
          {subtitle && <p className="text-white/40 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-white/10`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  )
}

// Chart card wrapper
function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`glass-card p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </Card>
  )
}

// Progress bar component
function ProgressBar({
  label,
  value,
  max,
  color = 'bg-blue-400',
}: {
  label: string
  value: number
  max: number
  color?: string
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/80">{label}</span>
        <span className="text-white/60">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function MetricsPage() {
  const [period, setPeriod] = useState<TimePeriod>('month')
  const [customRange, setCustomRange] = useState<DateRange>()
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [summary, setSummary] = useState({
    pipelineValue: 0,
    activeDeals: 0,
    avgDealSize: 0,
    avgDaysToClose: 0,
    winRate: 0,
    closedRevenue: 0,
    projectedRevenue: 0,
    revenueGrowth: 0,
    outreachThisMonth: 0,
    outreachTarget: 100,
    outreachProgress: 0,
    totalClients: 0,
    newThisMonth: 0,
    clientGrowth: 0,
  })
  const [winLoss, setWinLoss] = useState({
    won: 0,
    lost: 0,
    active: 0,
    winRate: 0,
    lossRate: 0,
    totalValue: 0,
    wonValue: 0,
    lostValue: 0,
  })
  const [velocity, setVelocity] = useState({
    avgDaysToClose: 0,
    avgDaysPerStage: {} as Record<string, number>,
    fastestDeal: null as number | null,
    slowestDeal: null as number | null,
  })
  const [leadSources, setLeadSources] = useState<
    { source: string; count: number; conversions: number; conversionRate: number; revenue: number }[]
  >([])
  const [revenueTrend, setRevenueTrend] = useState<{ date: string; revenue: number; deals: number }[]>([])
  const [dealsByStage, setDealsByStage] = useState<{ stage: string; count: number; value: number }[]>([])

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [summaryResult, winLossResult, velocityResult, leadSourceResult, revenueResult, stagesResult] =
        await Promise.all([
          getMetricsKPISummary(period, customRange),
          getWinLossStats(),
          getPipelineVelocity(),
          getLeadSourceAttribution(),
          getRevenueTrend(period, customRange),
          getDealsByStage(),
        ])

      setSummary(summaryResult.summary)
      setWinLoss(winLossResult.stats)
      setVelocity(velocityResult.velocity)
      setLeadSources(leadSourceResult.data)
      setRevenueTrend(revenueResult.data)
      setDealsByStage(stagesResult.data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [period, customRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle period change
  const handlePeriodChange = (newPeriod: TimePeriod, newCustomRange?: DateRange) => {
    setPeriod(newPeriod)
    setCustomRange(newCustomRange)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">KPI Metrics</h2>
            <p className="text-white/60">Key performance indicators and business metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <TimePeriodFilter
              value={period}
              onChange={handlePeriodChange}
              customRange={customRange}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={isLoading}
              className="glass-button"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(summary.pipelineValue)}
          icon={DollarSign}
          iconColor="text-green-400"
          subtitle={`${summary.activeDeals} active deals`}
        />
        <StatCard
          title="Avg Deal Size"
          value={formatCurrency(summary.avgDealSize)}
          icon={Briefcase}
          iconColor="text-blue-400"
          subtitle="Active pipeline"
        />
        <StatCard
          title="Win Rate"
          value={`${winLoss.winRate}%`}
          icon={Award}
          iconColor="text-yellow-400"
          subtitle={`${winLoss.won} won / ${winLoss.lost} lost`}
        />
        <StatCard
          title="Avg Days to Close"
          value={velocity.avgDaysToClose || '—'}
          icon={Clock}
          iconColor="text-purple-400"
          subtitle={velocity.fastestDeal ? `Fastest: ${velocity.fastestDeal}d` : undefined}
        />
      </div>

      {/* Secondary KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Closed Revenue"
          value={formatCurrency(summary.closedRevenue)}
          change={summary.revenueGrowth}
          icon={TrendingUp}
          iconColor="text-green-400"
          subtitle="This period"
        />
        <StatCard
          title="Projected Revenue"
          value={formatCurrency(summary.projectedRevenue)}
          icon={Target}
          iconColor="text-teal-400"
          subtitle="From active pipeline"
        />
        <StatCard
          title="New Clients"
          value={summary.newThisMonth}
          change={summary.clientGrowth}
          icon={UserPlus}
          iconColor="text-blue-400"
          subtitle={`${summary.totalClients} total`}
        />
        <StatCard
          title="Outreach Activity"
          value={summary.outreachThisMonth}
          icon={Activity}
          iconColor="text-pink-400"
          subtitle={`Target: ${summary.outreachTarget}`}
        />
      </div>

      {/* Win/Loss and Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Win/Loss Breakdown */}
        <ChartCard title="Deal Outcomes" className="lg:col-span-1">
          <div className="space-y-6">
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{winLoss.won}</p>
                <p className="text-white/60 text-sm">Won</p>
                <p className="text-green-400 text-xs">{formatCurrency(winLoss.wonValue)}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-400/20 flex items-center justify-center mx-auto mb-2">
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-white">{winLoss.lost}</p>
                <p className="text-white/60 text-sm">Lost</p>
                <p className="text-red-400 text-xs">{formatCurrency(winLoss.lostValue)}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-400/20 flex items-center justify-center mx-auto mb-2">
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{winLoss.active}</p>
                <p className="text-white/60 text-sm">Active</p>
                <p className="text-blue-400 text-xs">In progress</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <ProgressBar
                label="Win Rate"
                value={winLoss.won}
                max={winLoss.won + winLoss.lost}
                color="bg-green-400"
              />
            </div>
          </div>
        </ChartCard>

        {/* Targets Progress */}
        <ChartCard title="Monthly Targets" className="lg:col-span-1">
          <div className="space-y-6">
            <ProgressBar
              label="Outreach Target"
              value={summary.outreachThisMonth}
              max={summary.outreachTarget}
              color="bg-blue-400"
            />
            <ProgressBar
              label="Client Acquisition"
              value={summary.newThisMonth}
              max={10} // Example target
              color="bg-purple-400"
            />
            <ProgressBar
              label="Deal Closures"
              value={winLoss.won}
              max={5} // Example target
              color="bg-green-400"
            />
            <div className="pt-4 text-center">
              <p className="text-white/40 text-sm">
                {summary.outreachProgress >= 100 ? (
                  <span className="text-green-400">Outreach target achieved!</span>
                ) : (
                  `${summary.outreachTarget - summary.outreachThisMonth} outreach to go`
                )}
              </p>
            </div>
          </div>
        </ChartCard>

        {/* Lead Sources */}
        <ChartCard title="Lead Sources" className="lg:col-span-1">
          {leadSources.length > 0 ? (
            <div className="space-y-4">
              {leadSources.slice(0, 5).map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{source.source}</p>
                    <p className="text-white/40 text-xs">
                      {source.count} leads • {source.conversionRate}% conversion
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-medium">{formatCurrency(source.revenue)}</p>
                    <p className="text-white/40 text-xs">{source.conversions} converted</p>
                  </div>
                </div>
              ))}
              {leadSources.length === 0 && (
                <p className="text-white/40 text-center py-8">No lead source data available</p>
              )}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-white/40">
              No lead source data yet
            </div>
          )}
        </ChartCard>
      </div>

      {/* Revenue Trend */}
      <ChartCard title="Revenue Trend">
        {revenueTrend.length > 0 ? (
          <AnalyticsAreaChart
            data={revenueTrend}
            areas={[{ dataKey: 'revenue', name: 'Revenue', color: CHART_COLORS.primary }]}
            xAxisKey="date"
            height={280}
            valueFormatter={formatCurrency}
          />
        ) : (
          <div className="h-[280px] flex items-center justify-center text-white/40">
            No revenue data for this period
          </div>
        )}
      </ChartCard>

      {/* Pipeline Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Pipeline by Stage (Count)">
          {dealsByStage.some((d) => d.count > 0) ? (
            <AnalyticsDonutChart
              data={dealsByStage.map((d) => ({ name: d.stage, value: d.count }))}
              height={250}
              centerValue={summary.activeDeals.toString()}
              centerLabel="Active"
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-white/40">
              No pipeline data
            </div>
          )}
        </ChartCard>

        <ChartCard title="Pipeline by Stage (Value)">
          {dealsByStage.some((d) => d.value > 0) ? (
            <AnalyticsBarChart
              data={dealsByStage}
              bars={[{ dataKey: 'value', name: 'Commission Value', color: CHART_COLORS.secondary }]}
              xAxisKey="stage"
              height={250}
              valueFormatter={formatCurrency}
              horizontal
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-white/40">
              No pipeline data
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

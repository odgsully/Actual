'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AnalyticsBarChart,
  AnalyticsDonutChart,
  CHART_COLORS,
} from '@/components/admin/analytics'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  PlusCircle,
  Megaphone,
  BarChart3,
  Wallet,
  Percent,
  UserPlus,
  CheckCircle,
} from 'lucide-react'
import {
  getCampaignsWithMetrics,
  getCampaignSpendSummary,
  getSpendByType,
  type CampaignWithMetrics,
  type CampaignSpendSummary,
  type SpendByTypeData,
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
  action,
}: {
  title: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <Card className={`glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  )
}

// Campaign type labels
const campaignTypeLabels: Record<string, string> = {
  direct_mail: 'Direct Mail',
  digital_ads: 'Digital Ads',
  social_media: 'Social Media',
  email_marketing: 'Email Marketing',
  events: 'Events',
  referral_program: 'Referral Program',
  seo: 'SEO',
  print_ads: 'Print Ads',
  other: 'Other',
}

// Campaign status colors
const statusColors: Record<string, string> = {
  draft: 'bg-gray-400',
  active: 'bg-green-400',
  paused: 'bg-yellow-400',
  completed: 'bg-blue-400',
}

// Campaign row component
function CampaignRow({ campaign }: { campaign: CampaignWithMetrics }) {
  const spentPercent = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[campaign.status] || 'bg-gray-400'}`} />
          <h4 className="text-white font-medium truncate">{campaign.name}</h4>
        </div>
        <p className="text-white/40 text-sm">{campaignTypeLabels[campaign.type] || campaign.type}</p>
      </div>
      <div className="text-right">
        <p className="text-white font-medium">{formatCurrency(campaign.spent)}</p>
        <p className="text-white/40 text-xs">of {formatCurrency(campaign.budget)}</p>
      </div>
      <div className="w-24">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              spentPercent > 90 ? 'bg-red-400' : spentPercent > 70 ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
        <p className="text-white/40 text-xs text-center mt-1">{Math.round(spentPercent)}%</p>
      </div>
      <div className="text-center w-16">
        <p className="text-white font-medium">{campaign.leads_count}</p>
        <p className="text-white/40 text-xs">Leads</p>
      </div>
      <div className="text-center w-20">
        <p className={campaign.roi >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
          {campaign.roi >= 0 ? '+' : ''}{campaign.roi}%
        </p>
        <p className="text-white/40 text-xs">ROI</p>
      </div>
    </div>
  )
}

export default function CampaignSpendPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<CampaignSpendSummary>({
    totalBudget: 0,
    totalSpent: 0,
    budgetRemaining: 0,
    budgetUtilization: 0,
    activeCampaigns: 0,
    totalLeads: 0,
    totalConversions: 0,
    overallRoi: 0,
    avgCostPerLead: 0,
  })
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([])
  const [spendByType, setSpendByType] = useState<SpendByTypeData[]>([])

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [summaryResult, campaignsResult, spendResult] = await Promise.all([
        getCampaignSpendSummary(),
        getCampaignsWithMetrics(),
        getSpendByType(),
      ])

      setSummary(summaryResult.summary)
      setCampaigns(campaignsResult.campaigns)
      setSpendByType(spendResult.data)
    } catch (error) {
      console.error('Error fetching campaign data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Campaign Spend</h2>
            <p className="text-white/60">Track marketing campaign budgets, spend, and ROI</p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button className="glass-button flex items-center gap-2" disabled>
              <PlusCircle className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budget"
          value={formatCurrency(summary.totalBudget)}
          icon={Wallet}
          iconColor="text-blue-400"
          subtitle={`${summary.activeCampaigns} active campaigns`}
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(summary.totalSpent)}
          icon={DollarSign}
          iconColor="text-yellow-400"
          subtitle={`${summary.budgetUtilization}% utilized`}
        />
        <StatCard
          title="Overall ROI"
          value={`${summary.overallRoi >= 0 ? '+' : ''}${summary.overallRoi}%`}
          icon={summary.overallRoi >= 0 ? TrendingUp : TrendingDown}
          iconColor={summary.overallRoi >= 0 ? 'text-green-400' : 'text-red-400'}
          subtitle="Return on investment"
        />
        <StatCard
          title="Avg Cost per Lead"
          value={formatCurrency(summary.avgCostPerLead)}
          icon={UserPlus}
          iconColor="text-purple-400"
          subtitle={`${summary.totalLeads} total leads`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-4 text-center">
          <Megaphone className="h-5 w-5 text-blue-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{summary.activeCampaigns}</p>
          <p className="text-white/60 text-xs">Active Campaigns</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <Users className="h-5 w-5 text-purple-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{summary.totalLeads}</p>
          <p className="text-white/60 text-xs">Total Leads</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{summary.totalConversions}</p>
          <p className="text-white/60 text-xs">Conversions</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <Percent className="h-5 w-5 text-teal-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">
            {summary.totalLeads > 0
              ? Math.round((summary.totalConversions / summary.totalLeads) * 100)
              : 0}
            %
          </p>
          <p className="text-white/60 text-xs">Conversion Rate</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Type */}
        <ChartCard title="Spend by Channel">
          {spendByType.length > 0 ? (
            <AnalyticsDonutChart
              data={spendByType.map((s) => ({ name: s.label, value: s.spent }))}
              height={280}
              centerValue={formatCurrency(summary.totalSpent)}
              centerLabel="Total Spent"
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-white/40">
              No campaign spend data yet
            </div>
          )}
        </ChartCard>

        {/* Budget vs Spent */}
        <ChartCard title="Budget vs Spent by Channel">
          {spendByType.length > 0 ? (
            <AnalyticsBarChart
              data={spendByType}
              bars={[
                { dataKey: 'budget', name: 'Budget', color: CHART_COLORS.primary },
                { dataKey: 'spent', name: 'Spent', color: CHART_COLORS.tertiary },
              ]}
              xAxisKey="label"
              height={280}
              valueFormatter={formatCurrency}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-white/40">
              No campaign data yet
            </div>
          )}
        </ChartCard>
      </div>

      {/* Budget Utilization */}
      <ChartCard title="Budget Utilization">
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Overall Budget Usage</span>
            <span className="text-white">{summary.budgetUtilization}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                summary.budgetUtilization > 90
                  ? 'bg-red-400'
                  : summary.budgetUtilization > 70
                    ? 'bg-yellow-400'
                    : 'bg-green-400'
              }`}
              style={{ width: `${summary.budgetUtilization}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>Spent: {formatCurrency(summary.totalSpent)}</span>
            <span>Remaining: {formatCurrency(summary.budgetRemaining)}</span>
          </div>
        </div>
      </ChartCard>

      {/* Campaign List */}
      <ChartCard
        title="All Campaigns"
        action={
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <span>{campaigns.length} campaigns</span>
          </div>
        }
      >
        {campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Megaphone className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60 mb-2">No Campaigns Yet</h3>
            <p className="text-white/40 text-sm mb-4">
              Create your first marketing campaign to start tracking spend and ROI.
            </p>
            <Button className="glass-button" disabled>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        )}
      </ChartCard>

      {/* ROI Comparison */}
      {campaigns.length > 0 && (
        <ChartCard title="Campaign ROI Comparison">
          <AnalyticsBarChart
            data={campaigns
              .filter((c) => c.spent > 0)
              .map((c) => ({
                name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
                roi: c.roi,
                leads: c.leads_count,
              }))}
            bars={[{ dataKey: 'roi', name: 'ROI %', color: CHART_COLORS.secondary }]}
            xAxisKey="name"
            height={280}
            valueFormatter={(v) => `${v}%`}
            horizontal
          />
        </ChartCard>
      )}
    </div>
  )
}

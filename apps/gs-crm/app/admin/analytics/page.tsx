'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AnalyticsLineChart,
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
  Phone,
  Mail,
  Calendar,
  Target,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Briefcase,
  UserCheck,
  FileText,
} from 'lucide-react'
import type { TimePeriod, DateRange } from '@/lib/database/analytics'
import {
  getAnalyticsSummary,
  getRevenueTrend,
  getClientAcquisitionTrend,
  getOutreachTrend,
  getDealsByStage,
  getClientsByStatus,
  getClientsByType,
  getOutreachByType,
  getConversionRate,
} from '@/lib/database/analytics'

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

// Format number
const formatNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>('month')
  const [customRange, setCustomRange] = useState<DateRange>()
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Data states
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    revenueChange: 0,
    activeDeals: 0,
    closedDeals: 0,
    conversionRate: 0,
    avgDealValue: 0,
    totalClients: 0,
    newClientsThisPeriod: 0,
    clientsChange: 0,
    activeClients: 0,
    totalOutreach: 0,
    outreachChange: 0,
    callsCount: 0,
    emailsCount: 0,
    meetingsCount: 0,
  })
  const [revenueTrend, setRevenueTrend] = useState<{ date: string; revenue: number; deals: number }[]>([])
  const [clientTrend, setClientTrend] = useState<{ date: string; count: number }[]>([])
  const [outreachTrend, setOutreachTrend] = useState<{ date: string; calls: number; emails: number; meetings: number; texts: number; other: number; total: number }[]>([])
  const [dealsByStage, setDealsByStage] = useState<{ stage: string; count: number; value: number }[]>([])
  const [clientsByStatus, setClientsByStatus] = useState<{ status: string; count: number }[]>([])
  const [clientsByType, setClientsByType] = useState<{ type: string; count: number }[]>([])
  const [outreachByType, setOutreachByType] = useState<{ type: string; count: number; percentage: number }[]>([])
  const [conversion, setConversion] = useState({ rate: 0, closed: 0, total: 0 })

  // Fetch all analytics data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [
        summaryResult,
        revenueResult,
        clientResult,
        outreachResult,
        stagesResult,
        statusResult,
        typeResult,
        outreachTypeResult,
        conversionResult,
      ] = await Promise.all([
        getAnalyticsSummary(period, customRange),
        getRevenueTrend(period, customRange),
        getClientAcquisitionTrend(period, customRange),
        getOutreachTrend(period, customRange),
        getDealsByStage(),
        getClientsByStatus(),
        getClientsByType(),
        getOutreachByType(period, customRange),
        getConversionRate(),
      ])

      setSummary(summaryResult.summary)
      setRevenueTrend(revenueResult.data)
      setClientTrend(clientResult.data)
      setOutreachTrend(outreachResult.data)
      setDealsByStage(stagesResult.data)
      setClientsByStatus(statusResult.data)
      setClientsByType(typeResult.data)
      setOutreachByType(outreachTypeResult.data)
      setConversion(conversionResult)
    } catch (error) {
      console.error('Error fetching analytics:', error)
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

  // Export to PDF
  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      // Dynamic import of html2canvas and jspdf
      const [html2canvasModule, jspdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const html2canvas = html2canvasModule.default
      const { jsPDF } = jspdfModule

      if (!reportRef.current) return

      // Capture the report content
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#1a1a2e',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Download
      const date = new Date().toISOString().split('T')[0]
      pdf.save(`GSRealty-Analytics-Report-${date}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      // Fallback: show error message
      alert('PDF export requires html2canvas and jspdf packages. Please install them with: npm install html2canvas jspdf')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Analytics</h2>
            <p className="text-white/60">
              Track your sales, clients, and activity performance
            </p>
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
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="glass-button flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          change={summary.revenueChange}
          icon={DollarSign}
          iconColor="text-green-400"
          subtitle={`${summary.closedDeals} closed deals`}
        />
        <StatCard
          title="Active Deals"
          value={summary.activeDeals}
          icon={Briefcase}
          iconColor="text-blue-400"
          subtitle={`${summary.conversionRate}% conversion`}
        />
        <StatCard
          title="Total Clients"
          value={summary.totalClients}
          change={summary.clientsChange}
          icon={Users}
          iconColor="text-purple-400"
          subtitle={`+${summary.newClientsThisPeriod} this period`}
        />
        <StatCard
          title="Total Outreach"
          value={summary.totalOutreach}
          change={summary.outreachChange}
          icon={Phone}
          iconColor="text-yellow-400"
          subtitle={`${summary.callsCount} calls, ${summary.emailsCount} emails`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card p-4 text-center">
          <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{conversion.rate}%</p>
          <p className="text-white/60 text-xs">Conversion Rate</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <DollarSign className="h-5 w-5 text-blue-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{formatCurrency(summary.avgDealValue)}</p>
          <p className="text-white/60 text-xs">Avg Deal Value</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <UserCheck className="h-5 w-5 text-purple-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{summary.activeClients}</p>
          <p className="text-white/60 text-xs">Active Clients</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <Phone className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{summary.callsCount}</p>
          <p className="text-white/60 text-xs">Calls Made</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <Mail className="h-5 w-5 text-teal-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{summary.emailsCount}</p>
          <p className="text-white/60 text-xs">Emails Sent</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <Calendar className="h-5 w-5 text-pink-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{summary.meetingsCount}</p>
          <p className="text-white/60 text-xs">Meetings Held</p>
        </Card>
      </div>

      {/* Charts Row 1: Revenue & Clients Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Trend">
          {revenueTrend.length > 0 ? (
            <AnalyticsAreaChart
              data={revenueTrend}
              areas={[
                { dataKey: 'revenue', name: 'Revenue', color: CHART_COLORS.primary },
              ]}
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

        <ChartCard title="Client Acquisition">
          {clientTrend.length > 0 ? (
            <AnalyticsAreaChart
              data={clientTrend}
              areas={[
                { dataKey: 'count', name: 'New Clients', color: CHART_COLORS.tertiary },
              ]}
              xAxisKey="date"
              height={280}
              valueFormatter={(v) => v.toString()}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-white/40">
              No client data for this period
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2: Outreach Activity */}
      <ChartCard title="Outreach Activity">
        {outreachTrend.length > 0 ? (
          <AnalyticsBarChart
            data={outreachTrend}
            bars={[
              { dataKey: 'calls', name: 'Calls', color: CHART_COLORS.primary },
              { dataKey: 'emails', name: 'Emails', color: CHART_COLORS.secondary },
              { dataKey: 'meetings', name: 'Meetings', color: CHART_COLORS.tertiary },
              { dataKey: 'texts', name: 'Texts', color: CHART_COLORS.quaternary },
            ]}
            xAxisKey="date"
            height={300}
            stacked
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-white/40">
            No outreach data for this period
          </div>
        )}
      </ChartCard>

      {/* Charts Row 3: Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ChartCard title="Deals by Stage">
          {dealsByStage.some((d) => d.count > 0) ? (
            <AnalyticsDonutChart
              data={dealsByStage.map((d) => ({ name: d.stage, value: d.count }))}
              height={200}
              centerValue={summary.activeDeals.toString()}
              centerLabel="Active"
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-white/40">
              No deal data
            </div>
          )}
        </ChartCard>

        <ChartCard title="Clients by Status">
          {clientsByStatus.some((c) => c.count > 0) ? (
            <AnalyticsDonutChart
              data={clientsByStatus.map((c) => ({ name: c.status, value: c.count }))}
              height={200}
              centerValue={summary.totalClients.toString()}
              centerLabel="Total"
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-white/40">
              No client data
            </div>
          )}
        </ChartCard>

        <ChartCard title="Clients by Type">
          {clientsByType.some((c) => c.count > 0) ? (
            <AnalyticsDonutChart
              data={clientsByType.map((c) => ({ name: c.type, value: c.count }))}
              height={200}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-white/40">
              No client data
            </div>
          )}
        </ChartCard>

        <ChartCard title="Outreach Breakdown">
          {outreachByType.some((o) => o.count > 0) ? (
            <AnalyticsDonutChart
              data={outreachByType.map((o) => ({ name: o.type, value: o.count }))}
              height={200}
              centerValue={summary.totalOutreach.toString()}
              centerLabel="Total"
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-white/40">
              No outreach data
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 4: Deal Pipeline Value */}
      <ChartCard title="Pipeline Value by Stage">
        {dealsByStage.some((d) => d.value > 0) ? (
          <AnalyticsBarChart
            data={dealsByStage}
            bars={[
              { dataKey: 'value', name: 'Commission Value', color: CHART_COLORS.secondary },
            ]}
            xAxisKey="stage"
            height={280}
            valueFormatter={formatCurrency}
            horizontal
          />
        ) : (
          <div className="h-[280px] flex items-center justify-center text-white/40">
            No pipeline data
          </div>
        )}
      </ChartCard>
    </div>
  )
}

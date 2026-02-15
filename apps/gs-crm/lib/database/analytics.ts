/**
 * GSRealty Analytics Database Functions
 *
 * Aggregation and analytics queries for the Analytics dashboard
 * Provides time-series data, distributions, and performance metrics
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'

// Time period options
export type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface DateRange {
  start: Date
  end: Date
}

/**
 * Get date range for a time period
 */
export function getDateRangeForPeriod(period: TimePeriod, customRange?: DateRange): DateRange {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  let start = new Date(now)

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
      start.setDate(now.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      start.setHours(0, 0, 0, 0)
      break
    case 'quarter':
      start.setMonth(now.getMonth() - 3)
      start.setHours(0, 0, 0, 0)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      start.setHours(0, 0, 0, 0)
      break
    case 'custom':
      if (customRange) {
        return customRange
      }
      // Default to month if no custom range
      start.setMonth(now.getMonth() - 1)
      start.setHours(0, 0, 0, 0)
      break
  }

  return { start, end }
}

// =============================================================================
// SALES METRICS
// =============================================================================

export interface RevenueDataPoint {
  date: string
  revenue: number
  deals: number
}

/**
 * Get revenue trend over time
 */
export async function getRevenueTrend(
  period: TimePeriod,
  customRange?: DateRange
): Promise<{
  data: RevenueDataPoint[]
  total: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const { start, end } = getDateRangeForPeriod(period, customRange)

    const { data: deals, error } = await supabase
      .from('gsrealty_deals')
      .select('created_at, expected_commission, stage')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date based on period granularity
    const grouped = new Map<string, { revenue: number; deals: number }>()

    deals?.forEach((deal) => {
      const date = new Date(deal.created_at)
      let key: string

      if (period === 'today') {
        // Group by hour
        key = `${date.getHours()}:00`
      } else if (period === 'week' || period === 'month') {
        // Group by day
        key = date.toISOString().split('T')[0]
      } else {
        // Group by month for quarter/year
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      const existing = grouped.get(key) || { revenue: 0, deals: 0 }
      grouped.set(key, {
        revenue: existing.revenue + (Number(deal.expected_commission) || 0),
        deals: existing.deals + 1,
      })
    })

    const data: RevenueDataPoint[] = Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      revenue: values.revenue,
      deals: values.deals,
    }))

    const total = deals?.reduce((sum, d) => sum + (Number(d.expected_commission) || 0), 0) ?? 0

    return { data, total, error: null }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting revenue trend:', error)
    return { data: [], total: 0, error: error as Error }
  }
}

export interface DealStageData {
  stage: string
  count: number
  value: number
}

/**
 * Get deal distribution by stage
 */
export async function getDealsByStage(): Promise<{
  data: DealStageData[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data: deals, error } = await supabase
      .from('gsrealty_deals')
      .select('stage, expected_commission')

    if (error) throw error

    const stageMap = new Map<string, { count: number; value: number }>()
    const stageLabels: Record<string, string> = {
      on_radar: 'On Radar',
      official_representation: 'Represented',
      touring: 'Touring',
      offers_in: 'Offers In',
      under_contract: 'Under Contract',
      closed: 'Closed',
    }

    deals?.forEach((deal) => {
      const existing = stageMap.get(deal.stage) || { count: 0, value: 0 }
      stageMap.set(deal.stage, {
        count: existing.count + 1,
        value: existing.value + (Number(deal.expected_commission) || 0),
      })
    })

    const data: DealStageData[] = Object.keys(stageLabels).map((stage) => ({
      stage: stageLabels[stage],
      count: stageMap.get(stage)?.count || 0,
      value: stageMap.get(stage)?.value || 0,
    }))

    return { data, error: null }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting deals by stage:', error)
    return { data: [], error: error as Error }
  }
}

/**
 * Get conversion rate (closed deals / total deals)
 */
export async function getConversionRate(): Promise<{
  rate: number
  closed: number
  total: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { count: total, error: totalError } = await supabase
      .from('gsrealty_deals')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    const { count: closed, error: closedError } = await supabase
      .from('gsrealty_deals')
      .select('*', { count: 'exact', head: true })
      .eq('stage', 'closed')

    if (closedError) throw closedError

    const rate = total && total > 0 ? ((closed ?? 0) / total) * 100 : 0

    return {
      rate: Math.round(rate * 10) / 10,
      closed: closed ?? 0,
      total: total ?? 0,
      error: null,
    }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting conversion rate:', error)
    return { rate: 0, closed: 0, total: 0, error: error as Error }
  }
}

// =============================================================================
// CLIENT ANALYTICS
// =============================================================================

export interface ClientAcquisitionDataPoint {
  date: string
  count: number
}

/**
 * Get client acquisition trend over time
 */
export async function getClientAcquisitionTrend(
  period: TimePeriod,
  customRange?: DateRange
): Promise<{
  data: ClientAcquisitionDataPoint[]
  total: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const { start, end } = getDateRangeForPeriod(period, customRange)

    const { data: clients, error } = await supabase
      .from('gsrealty_clients')
      .select('created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date
    const grouped = new Map<string, number>()

    clients?.forEach((client) => {
      const date = new Date(client.created_at)
      let key: string

      if (period === 'today') {
        key = `${date.getHours()}:00`
      } else if (period === 'week' || period === 'month') {
        key = date.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      grouped.set(key, (grouped.get(key) || 0) + 1)
    })

    const data: ClientAcquisitionDataPoint[] = Array.from(grouped.entries()).map(
      ([date, count]) => ({
        date,
        count,
      })
    )

    return { data, total: clients?.length ?? 0, error: null }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting client acquisition:', error)
    return { data: [], total: 0, error: error as Error }
  }
}

export interface ClientStatusData {
  status: string
  count: number
}

/**
 * Get client distribution by status
 */
export async function getClientsByStatus(): Promise<{
  data: ClientStatusData[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data: clients, error } = await supabase.from('gsrealty_clients').select('status')

    if (error) throw error

    const statusMap = new Map<string, number>()
    const statusLabels: Record<string, string> = {
      active: 'Active',
      inactive: 'Inactive',
      prospect: 'Prospect',
    }

    clients?.forEach((client) => {
      statusMap.set(client.status, (statusMap.get(client.status) || 0) + 1)
    })

    const data: ClientStatusData[] = Object.keys(statusLabels).map((status) => ({
      status: statusLabels[status],
      count: statusMap.get(status) || 0,
    }))

    return { data, error: null }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting clients by status:', error)
    return { data: [], error: error as Error }
  }
}

export interface ClientTypeData {
  type: string
  count: number
}

/**
 * Get client distribution by type (buyer/seller/both)
 */
export async function getClientsByType(): Promise<{
  data: ClientTypeData[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data: clients, error } = await supabase.from('gsrealty_clients').select('client_type')

    if (error) throw error

    const typeMap = new Map<string, number>()
    const typeLabels: Record<string, string> = {
      buyer: 'Buyers',
      seller: 'Sellers',
      both: 'Both',
    }

    clients?.forEach((client) => {
      typeMap.set(client.client_type, (typeMap.get(client.client_type) || 0) + 1)
    })

    const data: ClientTypeData[] = Object.keys(typeLabels).map((type) => ({
      type: typeLabels[type],
      count: typeMap.get(type) || 0,
    }))

    return { data, error: null }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting clients by type:', error)
    return { data: [], error: error as Error }
  }
}

// =============================================================================
// ACTIVITY TRACKING
// =============================================================================

export interface OutreachTrendDataPoint {
  date: string
  calls: number
  emails: number
  meetings: number
  texts: number
  other: number
  total: number
}

/**
 * Get outreach activity trend over time
 */
export async function getOutreachTrend(
  period: TimePeriod,
  customRange?: DateRange
): Promise<{
  data: OutreachTrendDataPoint[]
  totals: Record<string, number>
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const { start, end } = getDateRangeForPeriod(period, customRange)

    const { data: outreach, error } = await supabase
      .from('gsrealty_outreach')
      .select('created_at, type')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date
    const grouped = new Map<
      string,
      { calls: number; emails: number; meetings: number; texts: number; other: number }
    >()

    outreach?.forEach((item) => {
      const date = new Date(item.created_at)
      let key: string

      if (period === 'today') {
        key = `${date.getHours()}:00`
      } else if (period === 'week' || period === 'month') {
        key = date.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      const existing = grouped.get(key) || {
        calls: 0,
        emails: 0,
        meetings: 0,
        texts: 0,
        other: 0,
      }
      existing[item.type as keyof typeof existing]++
      grouped.set(key, existing)
    })

    const data: OutreachTrendDataPoint[] = Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      ...values,
      total: values.calls + values.emails + values.meetings + values.texts + values.other,
    }))

    // Calculate totals
    const totals = {
      calls: 0,
      emails: 0,
      meetings: 0,
      texts: 0,
      other: 0,
      total: 0,
    }

    outreach?.forEach((item) => {
      totals[item.type as keyof typeof totals]++
      totals.total++
    })

    return { data, totals, error: null }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting outreach trend:', error)
    return {
      data: [],
      totals: { calls: 0, emails: 0, meetings: 0, texts: 0, other: 0, total: 0 },
      error: error as Error,
    }
  }
}

export interface OutreachTypeData {
  type: string
  count: number
  percentage: number
}

/**
 * Get outreach distribution by type (for pie chart)
 */
export async function getOutreachByType(
  period: TimePeriod,
  customRange?: DateRange
): Promise<{
  data: OutreachTypeData[]
  total: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const { start, end } = getDateRangeForPeriod(period, customRange)

    const { data: outreach, error } = await supabase
      .from('gsrealty_outreach')
      .select('type')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (error) throw error

    const typeMap = new Map<string, number>()
    const typeLabels: Record<string, string> = {
      call: 'Calls',
      email: 'Emails',
      meeting: 'Meetings',
      text: 'Texts',
      other: 'Other',
    }

    outreach?.forEach((item) => {
      typeMap.set(item.type, (typeMap.get(item.type) || 0) + 1)
    })

    const total = outreach?.length ?? 0

    const data: OutreachTypeData[] = Object.keys(typeLabels).map((type) => {
      const count = typeMap.get(type) || 0
      return {
        type: typeLabels[type],
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })

    return { data, total, error: null }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting outreach by type:', error)
    return { data: [], total: 0, error: error as Error }
  }
}

// =============================================================================
// SUMMARY STATS
// =============================================================================

export interface AnalyticsSummary {
  // Sales
  totalRevenue: number
  revenueChange: number
  activeDeals: number
  closedDeals: number
  conversionRate: number
  avgDealValue: number

  // Clients
  totalClients: number
  newClientsThisPeriod: number
  clientsChange: number
  activeClients: number

  // Activity
  totalOutreach: number
  outreachChange: number
  callsCount: number
  emailsCount: number
  meetingsCount: number
}

/**
 * Get comprehensive analytics summary for a time period
 */
export async function getAnalyticsSummary(
  period: TimePeriod,
  customRange?: DateRange
): Promise<{
  summary: AnalyticsSummary
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const { start, end } = getDateRangeForPeriod(period, customRange)

    // Calculate previous period for comparison
    const periodDuration = end.getTime() - start.getTime()
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - periodDuration)

    // Fetch all data in parallel
    const [
      currentDeals,
      prevDeals,
      allDeals,
      currentClients,
      prevClients,
      allClients,
      currentOutreach,
      prevOutreach,
    ] = await Promise.all([
      // Current period deals
      supabase
        .from('gsrealty_deals')
        .select('expected_commission, stage')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      // Previous period deals
      supabase
        .from('gsrealty_deals')
        .select('expected_commission')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString()),
      // All deals for conversion
      supabase.from('gsrealty_deals').select('stage, expected_commission'),
      // Current period clients
      supabase
        .from('gsrealty_clients')
        .select('id, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      // Previous period clients
      supabase
        .from('gsrealty_clients')
        .select('id')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString()),
      // All clients
      supabase.from('gsrealty_clients').select('status'),
      // Current period outreach
      supabase
        .from('gsrealty_outreach')
        .select('type')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      // Previous period outreach
      supabase
        .from('gsrealty_outreach')
        .select('type')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString()),
    ])

    // Calculate revenue
    const totalRevenue =
      currentDeals.data?.reduce((sum, d) => sum + (Number(d.expected_commission) || 0), 0) ?? 0
    const prevRevenue =
      prevDeals.data?.reduce((sum, d) => sum + (Number(d.expected_commission) || 0), 0) ?? 0
    const revenueChange =
      prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0

    // Calculate deals
    const activeDeals =
      allDeals.data?.filter((d) => d.stage !== 'closed').length ?? 0
    const closedDeals = allDeals.data?.filter((d) => d.stage === 'closed').length ?? 0
    const totalDeals = allDeals.data?.length ?? 0
    const conversionRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0
    const avgDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0

    // Calculate clients
    const totalClients = allClients.data?.length ?? 0
    const newClientsThisPeriod = currentClients.data?.length ?? 0
    const prevClientsCount = prevClients.data?.length ?? 0
    const clientsChange =
      prevClientsCount > 0
        ? Math.round(((newClientsThisPeriod - prevClientsCount) / prevClientsCount) * 100)
        : 0
    const activeClients = allClients.data?.filter((c) => c.status === 'active').length ?? 0

    // Calculate outreach
    const totalOutreach = currentOutreach.data?.length ?? 0
    const prevOutreachCount = prevOutreach.data?.length ?? 0
    const outreachChange =
      prevOutreachCount > 0
        ? Math.round(((totalOutreach - prevOutreachCount) / prevOutreachCount) * 100)
        : 0
    const callsCount = currentOutreach.data?.filter((o) => o.type === 'call').length ?? 0
    const emailsCount = currentOutreach.data?.filter((o) => o.type === 'email').length ?? 0
    const meetingsCount = currentOutreach.data?.filter((o) => o.type === 'meeting').length ?? 0

    return {
      summary: {
        totalRevenue,
        revenueChange,
        activeDeals,
        closedDeals,
        conversionRate,
        avgDealValue,
        totalClients,
        newClientsThisPeriod,
        clientsChange,
        activeClients,
        totalOutreach,
        outreachChange,
        callsCount,
        emailsCount,
        meetingsCount,
      },
      error: null,
    }
  } catch (error) {
    console.error('[GSRealty Analytics] Error getting summary:', error)
    return {
      summary: {
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
      },
      error: error as Error,
    }
  }
}

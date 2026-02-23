/**
 * GSRealty KPIs Database Functions
 *
 * Specialized KPI queries for the Metrics and Campaign Spend pages
 * Complements analytics.ts with campaign-specific and KPI-focused metrics
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { TimePeriod, DateRange, getDateRangeForPeriod } from './analytics'

// =============================================================================
// CAMPAIGN SPEND METRICS
// =============================================================================

export interface Campaign {
  id: string
  name: string
  type: string
  status: string
  budget: number
  spent: number
  start_date: string | null
  end_date: string | null
  target_audience: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Computed fields
  leads_count?: number
  conversions?: number
  roi?: number
}

export interface CampaignWithMetrics extends Campaign {
  leads_count: number
  conversions: number
  total_revenue: number
  roi: number
  cost_per_lead: number
}

/**
 * Get all campaigns with their performance metrics
 */
export async function getCampaignsWithMetrics(): Promise<{
  campaigns: CampaignWithMetrics[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('gsrealty_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (campaignsError) throw campaignsError

    // Get campaign leads with conversion data
    const { data: campaignLeads, error: leadsError } = await supabase
      .from('gsrealty_campaign_leads')
      .select(`
        campaign_id,
        conversion_value,
        client:gsrealty_clients(
          id,
          status
        )
      `)

    if (leadsError) throw leadsError

    // Calculate metrics for each campaign
    const campaignsWithMetrics: CampaignWithMetrics[] = (campaigns ?? []).map((campaign) => {
      const leads = campaignLeads?.filter((l) => l.campaign_id === campaign.id) ?? []
      const leadsCount = leads.length
      const conversions = leads.filter((l) => {
        const client = Array.isArray(l.client) ? l.client[0] : l.client
        return client?.status === 'active'
      }).length
      const totalRevenue = leads.reduce((sum, l) => sum + (Number(l.conversion_value) || 0), 0)
      const spent = Number(campaign.spent) || 0
      const roi = spent > 0 ? ((totalRevenue - spent) / spent) * 100 : 0
      const costPerLead = leadsCount > 0 ? spent / leadsCount : 0

      return {
        ...campaign,
        budget: Number(campaign.budget) || 0,
        spent,
        leads_count: leadsCount,
        conversions,
        total_revenue: totalRevenue,
        roi: Math.round(roi * 10) / 10,
        cost_per_lead: Math.round(costPerLead * 100) / 100,
      }
    })

    return { campaigns: campaignsWithMetrics, error: null }
  } catch (error) {
    console.error('[GSRealty KPIs] Error getting campaigns with metrics:', error)
    return { campaigns: [], error: error as Error }
  }
}

export interface CampaignSpendSummary {
  totalBudget: number
  totalSpent: number
  budgetRemaining: number
  budgetUtilization: number
  activeCampaigns: number
  totalLeads: number
  totalConversions: number
  overallRoi: number
  avgCostPerLead: number
}

/**
 * Get campaign spend summary
 */
export async function getCampaignSpendSummary(): Promise<{
  summary: CampaignSpendSummary
  error: Error | null
}> {
  try {
    const { campaigns, error } = await getCampaignsWithMetrics()
    if (error) throw error

    const activeCampaigns = campaigns.filter((c) => c.status === 'active')
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads_count, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.total_revenue, 0)

    return {
      summary: {
        totalBudget,
        totalSpent,
        budgetRemaining: totalBudget - totalSpent,
        budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        activeCampaigns: activeCampaigns.length,
        totalLeads,
        totalConversions,
        overallRoi: totalSpent > 0 ? Math.round(((totalRevenue - totalSpent) / totalSpent) * 100) : 0,
        avgCostPerLead: totalLeads > 0 ? Math.round((totalSpent / totalLeads) * 100) / 100 : 0,
      },
      error: null,
    }
  } catch (error) {
    console.error('[GSRealty KPIs] Error getting campaign spend summary:', error)
    return {
      summary: {
        totalBudget: 0,
        totalSpent: 0,
        budgetRemaining: 0,
        budgetUtilization: 0,
        activeCampaigns: 0,
        totalLeads: 0,
        totalConversions: 0,
        overallRoi: 0,
        avgCostPerLead: 0,
      },
      error: error as Error,
    }
  }
}

export interface SpendByTypeData {
  [key: string]: string | number
  type: string
  label: string
  budget: number
  spent: number
  campaigns: number
}

/**
 * Get campaign spend breakdown by type
 */
export async function getSpendByType(): Promise<{
  data: SpendByTypeData[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data: campaigns, error } = await supabase
      .from('gsrealty_campaigns')
      .select('type, budget, spent')

    if (error) throw error

    const typeLabels: Record<string, string> = {
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

    const typeMap = new Map<string, { budget: number; spent: number; campaigns: number }>()

    campaigns?.forEach((campaign) => {
      const existing = typeMap.get(campaign.type) || { budget: 0, spent: 0, campaigns: 0 }
      typeMap.set(campaign.type, {
        budget: existing.budget + (Number(campaign.budget) || 0),
        spent: existing.spent + (Number(campaign.spent) || 0),
        campaigns: existing.campaigns + 1,
      })
    })

    const data: SpendByTypeData[] = Object.keys(typeLabels)
      .map((type) => ({
        type,
        label: typeLabels[type],
        budget: typeMap.get(type)?.budget || 0,
        spent: typeMap.get(type)?.spent || 0,
        campaigns: typeMap.get(type)?.campaigns || 0,
      }))
      .filter((d) => d.campaigns > 0)
      .sort((a, b) => b.spent - a.spent)

    return { data, error: null }
  } catch (error) {
    console.error('[GSRealty KPIs] Error getting spend by type:', error)
    return { data: [], error: error as Error }
  }
}

export interface SpendTrendDataPoint {
  date: string
  spent: number
  leads: number
}

/**
 * Get campaign spend trend over time
 */
export async function getSpendTrend(
  period: TimePeriod,
  customRange?: DateRange
): Promise<{
  data: SpendTrendDataPoint[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const { start, end } = getDateRangeForPeriod(period, customRange)

    // Get campaigns active in this period
    const { data: campaigns, error: campaignsError } = await supabase
      .from('gsrealty_campaigns')
      .select('id, spent, start_date, end_date')
      .or(`start_date.lte.${end.toISOString()},start_date.is.null`)
      .or(`end_date.gte.${start.toISOString()},end_date.is.null`)

    if (campaignsError) throw campaignsError

    // Get leads attributed in this period
    const { data: leads, error: leadsError } = await supabase
      .from('gsrealty_campaign_leads')
      .select('attributed_at')
      .gte('attributed_at', start.toISOString())
      .lte('attributed_at', end.toISOString())

    if (leadsError) throw leadsError

    // Group leads by date
    const grouped = new Map<string, { leads: number }>()

    leads?.forEach((lead) => {
      const date = new Date(lead.attributed_at)
      let key: string

      if (period === 'today') {
        key = `${date.getHours()}:00`
      } else if (period === 'week' || period === 'month') {
        key = date.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      const existing = grouped.get(key) || { leads: 0 }
      grouped.set(key, { leads: existing.leads + 1 })
    })

    // Calculate daily spend (simplified - divides total spend across active period)
    const totalSpent = campaigns?.reduce((sum, c) => sum + (Number(c.spent) || 0), 0) ?? 0
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const dailySpend = totalSpent / days

    const data: SpendTrendDataPoint[] = Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      spent: Math.round(dailySpend * 100) / 100,
      leads: values.leads,
    }))

    return { data, error: null }
  } catch (error) {
    console.error('[GSRealty KPIs] Error getting spend trend:', error)
    return { data: [], error: error as Error }
  }
}

// =============================================================================
// ADVANCED METRICS (Metrics Page)
// =============================================================================

export interface PipelineVelocity {
  avgDaysToClose: number
  avgDaysPerStage: Record<string, number>
  fastestDeal: number | null
  slowestDeal: number | null
}

/**
 * Calculate pipeline velocity metrics
 */
export async function getPipelineVelocity(): Promise<{
  velocity: PipelineVelocity
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data: closedDeals, error } = await supabase
      .from('gsrealty_deals')
      .select('created_at, closed_at')
      .eq('stage', 'closed')
      .not('closed_at', 'is', null)

    if (error) throw error

    if (!closedDeals || closedDeals.length === 0) {
      return {
        velocity: {
          avgDaysToClose: 0,
          avgDaysPerStage: {},
          fastestDeal: null,
          slowestDeal: null,
        },
        error: null,
      }
    }

    const daysToClose = closedDeals.map((deal) => {
      const created = new Date(deal.created_at)
      const closed = new Date(deal.closed_at!)
      return Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    })

    const avgDaysToClose = Math.round(daysToClose.reduce((a, b) => a + b, 0) / daysToClose.length)
    const fastestDeal = Math.min(...daysToClose)
    const slowestDeal = Math.max(...daysToClose)

    return {
      velocity: {
        avgDaysToClose,
        avgDaysPerStage: {}, // Would require stage change tracking
        fastestDeal,
        slowestDeal,
      },
      error: null,
    }
  } catch (error) {
    console.error('[GSRealty KPIs] Error getting pipeline velocity:', error)
    return {
      velocity: {
        avgDaysToClose: 0,
        avgDaysPerStage: {},
        fastestDeal: null,
        slowestDeal: null,
      },
      error: error as Error,
    }
  }
}

export interface WinLossStats {
  won: number
  lost: number
  active: number
  winRate: number
  lossRate: number
  totalValue: number
  wonValue: number
  lostValue: number
}

/**
 * Get win/loss statistics
 */
export async function getWinLossStats(): Promise<{
  stats: WinLossStats
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data: deals, error } = await supabase
      .from('gsrealty_deals')
      .select('stage, won, deal_value')

    if (error) throw error

    const won = deals?.filter((d) => d.stage === 'closed' && d.won === true).length ?? 0
    const lost = deals?.filter((d) => d.stage === 'lost' || (d.stage === 'closed' && d.won === false)).length ?? 0
    const active = deals?.filter((d) => d.stage !== 'closed' && d.stage !== 'lost').length ?? 0
    const total = won + lost

    const wonValue = deals
      ?.filter((d) => d.stage === 'closed' && d.won === true)
      .reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0) ?? 0

    const lostValue = deals
      ?.filter((d) => d.stage === 'lost' || (d.stage === 'closed' && d.won === false))
      .reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0) ?? 0

    return {
      stats: {
        won,
        lost,
        active,
        winRate: total > 0 ? Math.round((won / total) * 100) : 0,
        lossRate: total > 0 ? Math.round((lost / total) * 100) : 0,
        totalValue: wonValue + lostValue,
        wonValue,
        lostValue,
      },
      error: null,
    }
  } catch (error) {
    console.error('[GSRealty KPIs] Error getting win/loss stats:', error)
    return {
      stats: {
        won: 0,
        lost: 0,
        active: 0,
        winRate: 0,
        lossRate: 0,
        totalValue: 0,
        wonValue: 0,
        lostValue: 0,
      },
      error: error as Error,
    }
  }
}

export interface LeadSourceData {
  source: string
  count: number
  conversions: number
  conversionRate: number
  revenue: number
}

/**
 * Get lead source attribution
 */
export async function getLeadSourceAttribution(): Promise<{
  data: LeadSourceData[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Get clients with lead source
    const { data: clients, error: clientsError } = await supabase
      .from('gsrealty_clients')
      .select('id, lead_source, status')

    if (clientsError) throw clientsError

    // Get deals for revenue calculation
    const { data: deals, error: dealsError } = await supabase
      .from('gsrealty_deals')
      .select('client_id, expected_commission, stage')
      .eq('stage', 'closed')

    if (dealsError) throw dealsError

    // Group by lead source
    const sourceMap = new Map<string, { count: number; conversions: number; revenue: number }>()

    clients?.forEach((client) => {
      const source = client.lead_source || 'Unknown'
      const existing = sourceMap.get(source) || { count: 0, conversions: 0, revenue: 0 }

      existing.count++
      if (client.status === 'active') {
        existing.conversions++
      }

      // Add revenue from closed deals
      const clientDeals = deals?.filter((d) => d.client_id === client.id) ?? []
      existing.revenue += clientDeals.reduce((sum, d) => sum + (Number(d.expected_commission) || 0), 0)

      sourceMap.set(source, existing)
    })

    const data: LeadSourceData[] = Array.from(sourceMap.entries())
      .map(([source, values]) => ({
        source,
        count: values.count,
        conversions: values.conversions,
        conversionRate: values.count > 0 ? Math.round((values.conversions / values.count) * 100) : 0,
        revenue: values.revenue,
      }))
      .sort((a, b) => b.count - a.count)

    return { data, error: null }
  } catch (error) {
    console.error('[GSRealty KPIs] Error getting lead source attribution:', error)
    return { data: [], error: error as Error }
  }
}

// =============================================================================
// KPI SUMMARY FOR METRICS PAGE
// =============================================================================

export interface MetricsKPISummary {
  // Pipeline
  pipelineValue: number
  activeDeals: number
  avgDealSize: number
  avgDaysToClose: number
  winRate: number

  // Revenue
  closedRevenue: number
  projectedRevenue: number
  revenueGrowth: number

  // Activity
  outreachThisMonth: number
  outreachTarget: number
  outreachProgress: number

  // Clients
  totalClients: number
  newThisMonth: number
  clientGrowth: number
}

/**
 * Get comprehensive KPI summary for Metrics page
 */
export async function getMetricsKPISummary(
  period: TimePeriod = 'month',
  customRange?: DateRange
): Promise<{
  summary: MetricsKPISummary
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const { start, end } = getDateRangeForPeriod(period, customRange)

    // Calculate previous period
    const periodDuration = end.getTime() - start.getTime()
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - periodDuration)

    // Fetch all data in parallel
    const [activeDealsResult, closedDealsResult, velocityResult, outreachResult, prevOutreachResult, clientsResult, prevClientsResult] =
      await Promise.all([
        // Active deals
        supabase
          .from('gsrealty_deals')
          .select('deal_value, expected_commission')
          .not('stage', 'in', '("closed","lost")'),
        // Closed deals in period
        supabase
          .from('gsrealty_deals')
          .select('expected_commission, closed_at')
          .eq('stage', 'closed')
          .gte('closed_at', start.toISOString())
          .lte('closed_at', end.toISOString()),
        // Pipeline velocity
        getPipelineVelocity(),
        // Outreach this period
        supabase
          .from('gsrealty_outreach')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        // Previous period outreach
        supabase
          .from('gsrealty_outreach')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString()),
        // New clients this period
        supabase
          .from('gsrealty_clients')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        // Previous period clients
        supabase
          .from('gsrealty_clients')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString()),
      ])

    // Also get win/loss and total clients
    const [winLossResult, totalClientsResult] = await Promise.all([
      getWinLossStats(),
      supabase.from('gsrealty_clients').select('id', { count: 'exact', head: true }),
    ])

    // Calculate metrics
    const activeDeals = activeDealsResult.data ?? []
    const pipelineValue = activeDeals.reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0)
    const projectedRevenue = activeDeals.reduce((sum, d) => sum + (Number(d.expected_commission) || 0), 0)
    const avgDealSize = activeDeals.length > 0 ? pipelineValue / activeDeals.length : 0

    const closedDeals = closedDealsResult.data ?? []
    const closedRevenue = closedDeals.reduce((sum, d) => sum + (Number(d.expected_commission) || 0), 0)

    const outreachThisMonth = outreachResult.count ?? 0
    const prevOutreachCount = prevOutreachResult.count ?? 0
    const outreachTarget = 100 // Default target, could be configurable

    const newThisMonth = clientsResult.count ?? 0
    const prevClientsCount = prevClientsResult.count ?? 0
    const totalClients = totalClientsResult.count ?? 0
    const clientGrowth =
      prevClientsCount > 0 ? Math.round(((newThisMonth - prevClientsCount) / prevClientsCount) * 100) : 0

    // Revenue growth (comparing closed revenue to previous period would need another query)
    const revenueGrowth = 0 // Simplified for now

    return {
      summary: {
        pipelineValue,
        activeDeals: activeDeals.length,
        avgDealSize: Math.round(avgDealSize),
        avgDaysToClose: velocityResult.velocity.avgDaysToClose,
        winRate: winLossResult.stats.winRate,
        closedRevenue,
        projectedRevenue,
        revenueGrowth,
        outreachThisMonth,
        outreachTarget,
        outreachProgress: Math.round((outreachThisMonth / outreachTarget) * 100),
        totalClients,
        newThisMonth,
        clientGrowth,
      },
      error: null,
    }
  } catch (error) {
    console.error('[GSRealty KPIs] Error getting metrics summary:', error)
    return {
      summary: {
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
      },
      error: error as Error,
    }
  }
}

// =============================================================================
// CAMPAIGN CRUD OPERATIONS
// =============================================================================

export interface CreateCampaignInput {
  name: string
  type: Campaign['type']
  status?: Campaign['status']
  budget?: number
  spent?: number
  start_date?: string
  end_date?: string
  target_audience?: string
  notes?: string
}

/**
 * Create a new campaign
 */
export async function createCampaign(input: CreateCampaignInput): Promise<{
  campaign: Campaign | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_campaigns')
      .insert({
        name: input.name,
        type: input.type,
        status: input.status || 'draft',
        budget: input.budget || 0,
        spent: input.spent || 0,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        target_audience: input.target_audience || null,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return { campaign: data, error: null }
  } catch (error) {
    console.error('[GSRealty KPIs] Error creating campaign:', error)
    return { campaign: null, error: error as Error }
  }
}

/**
 * Update campaign spend
 */
export async function updateCampaignSpend(
  campaignId: string,
  spent: number
): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('gsrealty_campaigns')
      .update({ spent })
      .eq('id', campaignId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty KPIs] Error updating campaign spend:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Attribute a lead to a campaign
 */
export async function attributeLeadToCampaign(
  campaignId: string,
  clientId: string,
  conversionValue?: number
): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase.from('gsrealty_campaign_leads').insert({
      campaign_id: campaignId,
      client_id: clientId,
      conversion_value: conversionValue || null,
    })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty KPIs] Error attributing lead to campaign:', error)
    return { success: false, error: error as Error }
  }
}

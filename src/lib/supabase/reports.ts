import { supabase } from './client'

export interface DailyCollectionSummary {
  route_date: string
  collector_id: string
  collector_name: string
  total_clients: number
  clients_paid: number
  clients_not_paid: number
  clients_absent: number
  total_collected: number
  total_expected: number
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  collectorId?: string
  routeId?: string
}

export interface PaymentsByStatus {
  payment_status: string
  count: number
  total_amount: number
}

export interface CollectorPerformance {
  collector_id: string
  collector_name: string
  total_routes: number
  total_clients: number
  clients_paid: number
  collection_rate: number
  total_collected: number
}

// Get daily collection summary with filters
export async function getDailyCollectionSummary(filters: ReportFilters = {}) {
  let query = supabase
    .from('daily_collection_summary')
    .select('*')
    .order('route_date', { ascending: false })

  if (filters.startDate) {
    query = query.gte('route_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('route_date', filters.endDate)
  }

  if (filters.collectorId) {
    query = query.eq('collector_id', filters.collectorId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching daily collection summary:', error)
    throw error
  }

  return data as DailyCollectionSummary[]
}

// Get payments by status for a date range
export async function getPaymentsByStatus(filters: ReportFilters = {}) {
  let query = supabase
    .from('payments')
    .select(`
      payment_status,
      amount_paid,
      recorded_at
    `)

  if (filters.startDate) {
    query = query.gte('recorded_at', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('recorded_at', filters.endDate + 'T23:59:59')
  }

  if (filters.collectorId) {
    query = query.eq('recorded_by', filters.collectorId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching payments by status:', error)
    throw error
  }

  // Aggregate data by status
  const aggregated = data?.reduce((acc, payment) => {
    const status = payment.payment_status
    if (!acc[status]) {
      acc[status] = { payment_status: status, count: 0, total_amount: 0 }
    }
    acc[status].count += 1
    acc[status].total_amount += payment.amount_paid || 0
    return acc
  }, {} as Record<string, PaymentsByStatus>)

  return Object.values(aggregated || {}) as PaymentsByStatus[]
}

// Get collector performance metrics
export async function getCollectorPerformance(filters: ReportFilters = {}) {
  let query = supabase
    .from('daily_collection_summary')
    .select('*')

  if (filters.startDate) {
    query = query.gte('route_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('route_date', filters.endDate)
  }

  if (filters.collectorId) {
    query = query.eq('collector_id', filters.collectorId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching collector performance:', error)
    throw error
  }

  // Aggregate data by collector
  const aggregated = data?.reduce((acc, summary) => {
    const collectorId = summary.collector_id
    if (!acc[collectorId]) {
      acc[collectorId] = {
        collector_id: collectorId,
        collector_name: summary.collector_name,
        total_routes: 0,
        total_clients: 0,
        clients_paid: 0,
        collection_rate: 0,
        total_collected: 0
      }
    }

    const collector = acc[collectorId]
    collector.total_routes += 1
    collector.total_clients += summary.total_clients
    collector.clients_paid += summary.clients_paid
    collector.total_collected += summary.total_collected

    return acc
  }, {} as Record<string, CollectorPerformance>)

  // Calculate collection rates
  const collectors = Object.values(aggregated || {}) as CollectorPerformance[]
  collectors.forEach((collector) => {
    collector.collection_rate = collector.total_clients > 0 
      ? (collector.clients_paid / collector.total_clients) * 100 
      : 0
  })

  return collectors
}

// Get total metrics for dashboard
export async function getTotalMetrics(filters: ReportFilters = {}) {
  const summaries = await getDailyCollectionSummary(filters)
  
  const totals = summaries.reduce((acc, summary) => {
    acc.totalClients += summary.total_clients
    acc.clientsPaid += summary.clients_paid
    acc.clientsNotPaid += summary.clients_not_paid
    acc.clientsAbsent += summary.clients_absent
    acc.totalCollected += summary.total_collected
    acc.totalExpected += summary.total_expected
    return acc
  }, {
    totalClients: 0,
    clientsPaid: 0,
    clientsNotPaid: 0,
    clientsAbsent: 0,
    totalCollected: 0,
    totalExpected: 0
  })

  return {
    ...totals,
    collectionRate: totals.totalClients > 0 ? (totals.clientsPaid / totals.totalClients) * 100 : 0,
    collectionEfficiency: totals.totalExpected > 0 ? (totals.totalCollected / totals.totalExpected) * 100 : 0
  }
}

// Get all collectors for filter dropdown
export async function getCollectors() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'collector')
    .order('full_name')

  if (error) {
    console.error('Error fetching collectors:', error)
    throw error
  }

  return data
}
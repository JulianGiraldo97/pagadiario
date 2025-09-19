'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/lib/auth/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ReportFilters from '@/components/forms/ReportFilters'
import MetricsCards from '@/components/ui/MetricsCards'
import CollectionChart from '@/components/charts/CollectionChart'
import PaymentStatusChart from '@/components/charts/PaymentStatusChart'
import CollectorPerformanceChart from '@/components/charts/CollectorPerformanceChart'
import ReportsTable from '@/components/tables/ReportsTable'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  getDailyCollectionSummary,
  getPaymentsByStatus,
  getCollectorPerformance,
  getTotalMetrics,
  ReportFilters as IReportFilters,
  DailyCollectionSummary,
  PaymentsByStatus,
  CollectorPerformance
} from '@/lib/supabase/reports'
import { securityLogger, SecurityLogLevel, SecurityEventType, requireRole } from '@/lib/utils/security'

function ReportsPageContent() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<IReportFilters>({})
  const [dailySummary, setDailySummary] = useState<DailyCollectionSummary[]>([])
  const [paymentsByStatus, setPaymentsByStatus] = useState<PaymentsByStatus[]>([])
  const [collectorPerformance, setCollectorPerformance] = useState<CollectorPerformance[]>([])
  const [totalMetrics, setTotalMetrics] = useState({
    totalClients: 0,
    clientsPaid: 0,
    clientsNotPaid: 0,
    clientsAbsent: 0,
    totalCollected: 0,
    totalExpected: 0,
    collectionRate: 0,
    collectionEfficiency: 0
  })

  useEffect(() => {
    // Validate admin access on component mount
    if (profile) {
      try {
        requireRole(profile.role, 'admin')
        
        // Log admin access to reports
        securityLogger.log({
          level: SecurityLogLevel.INFO,
          event: SecurityEventType.DATA_ACCESS,
          userId: user?.id,
          userRole: profile.role,
          path: '/admin/reports',
          success: true,
          details: { action: 'reports_page_access' }
        })
      } catch (error) {
        toast.error('Acceso denegado: Solo administradores pueden ver reportes')
        return
      }
    }

    // Set default filters (last 30 days)
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const defaultFilters = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate
    }
    
    setFilters(defaultFilters)
    loadReportData(defaultFilters)
  }, [profile, user])

  const loadReportData = async (currentFilters: IReportFilters) => {
    if (!profile) return
    
    try {
      requireRole(profile.role, 'admin')
    } catch (error) {
      toast.error('Acceso denegado para cargar datos de reportes')
      return
    }

    setLoading(true)
    try {
      // Log report data access
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.DATA_ACCESS,
        userId: user?.id,
        userRole: profile.role,
        path: '/admin/reports',
        success: true,
        details: { 
          action: 'load_report_data',
          filters: currentFilters
        }
      })

      const [summary, payments, performance, metrics] = await Promise.all([
        getDailyCollectionSummary(currentFilters),
        getPaymentsByStatus(currentFilters),
        getCollectorPerformance(currentFilters),
        getTotalMetrics(currentFilters)
      ])

      setDailySummary(summary)
      setPaymentsByStatus(payments)
      setCollectorPerformance(performance as CollectorPerformance[])
      setTotalMetrics(metrics)

      // Log successful data load
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.DATA_ACCESS,
        userId: user?.id,
        userRole: profile.role,
        success: true,
        details: { 
          action: 'report_data_loaded',
          recordCount: summary.length + payments.length + performance.length
        }
      })
    } catch (error) {
      console.error('Error loading report data:', error)
      
      // Log error
      securityLogger.log({
        level: SecurityLogLevel.ERROR,
        event: SecurityEventType.DATA_ACCESS,
        userId: user?.id,
        userRole: profile?.role,
        success: false,
        details: { 
          action: 'load_report_data_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      toast.error('Error al cargar los datos del reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: IReportFilters) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    loadReportData(filters)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Reportes y Métricas
        </h2>
        <div className="text-muted">
          <i className="bi bi-calendar3 me-1"></i>
          {filters.startDate && filters.endDate && (
            <>
              {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
            </>
          )}
        </div>
      </div>

      <ReportFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
      />

      <MetricsCards metrics={totalMetrics} />

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <CollectionChart data={dailySummary} />
        </div>
        <div className="col-lg-4">
          <PaymentStatusChart data={paymentsByStatus} />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12">
          <CollectorPerformanceChart data={collectorPerformance} />
        </div>
      </div>

      <ReportsTable data={dailySummary} />
    </div>
  )
}

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']} requireExactRole={true}>
      <ReportsPageContent />
    </ProtectedRoute>
  )
}
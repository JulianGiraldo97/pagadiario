'use client'

import { useState, useEffect } from 'react'
import { ReportFilters as IReportFilters } from '@/lib/supabase/reports'
import { getCollectors } from '@/lib/supabase/reports'

interface ReportFiltersProps {
  filters: IReportFilters
  onFiltersChange: (filters: IReportFilters) => void
  onApplyFilters: () => void
}

interface Collector {
  id: string
  full_name: string
}

export default function ReportFilters({ filters, onFiltersChange, onApplyFilters }: ReportFiltersProps) {
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCollectors()
  }, [])

  const loadCollectors = async () => {
    try {
      const data = await getCollectors()
      setCollectors(data)
    } catch (error) {
      console.error('Error loading collectors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof IReportFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined
    })
  }

  const handleReset = () => {
    onFiltersChange({})
  }

  // Set default dates (last 30 days)
  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getDefaultStartDate = () => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-funnel me-2"></i>
          Filtros de Reporte
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-3">
            <label htmlFor="startDate" className="form-label">Fecha Inicio</label>
            <input
              type="date"
              className="form-control"
              id="startDate"
              value={filters.startDate || getDefaultStartDate()}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label htmlFor="endDate" className="form-label">Fecha Fin</label>
            <input
              type="date"
              className="form-control"
              id="endDate"
              value={filters.endDate || getDefaultEndDate()}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <label htmlFor="collectorId" className="form-label">Cobrador</label>
            <select
              className="form-select"
              id="collectorId"
              value={filters.collectorId || ''}
              onChange={(e) => handleInputChange('collectorId', e.target.value)}
              disabled={loading}
            >
              <option value="">Todos los cobradores</option>
              {collectors.map((collector) => (
                <option key={collector.id} value={collector.id}>
                  {collector.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2 d-flex align-items-end">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onApplyFilters}
              >
                <i className="bi bi-search me-1"></i>
                Aplicar
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleReset}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
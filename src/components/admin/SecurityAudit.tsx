'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { 
  securityLogger, 
  SecurityLogLevel, 
  SecurityEventType,
  SecurityLogEntry,
  requireRole
} from '@/lib/utils/security'

interface SecurityAuditProps {
  maxEntries?: number
}

export default function SecurityAudit({ maxEntries = 100 }: SecurityAuditProps) {
  const { user, profile } = useAuth()
  const [logs, setLogs] = useState<SecurityLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<SecurityLogEntry[]>([])
  const [filters, setFilters] = useState({
    level: '',
    event: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      try {
        requireRole(profile.role, 'admin')
        loadSecurityLogs()
      } catch (error) {
        console.error('Access denied to security audit')
      }
    }
  }, [profile])

  useEffect(() => {
    applyFilters()
  }, [logs, filters])

  const loadSecurityLogs = () => {
    setLoading(true)
    try {
      const recentLogs = securityLogger.getRecentLogs(maxEntries)
      setLogs(recentLogs)
    } catch (error) {
      console.error('Error loading security logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level)
    }

    if (filters.event) {
      filtered = filtered.filter(log => log.event === filters.event)
    }

    if (filters.userId) {
      filtered = filtered.filter(log => 
        log.userId?.toLowerCase().includes(filters.userId.toLowerCase())
      )
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate)
    }

    setFilteredLogs(filtered)
  }

  const clearFilters = () => {
    setFilters({
      level: '',
      event: '',
      userId: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  const clearLogs = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los logs de seguridad?')) {
      securityLogger.clearLogs()
      setLogs([])
      setFilteredLogs([])
    }
  }

  const getLevelBadgeClass = (level: SecurityLogLevel) => {
    switch (level) {
      case SecurityLogLevel.CRITICAL:
        return 'bg-danger'
      case SecurityLogLevel.ERROR:
        return 'bg-danger'
      case SecurityLogLevel.WARNING:
        return 'bg-warning'
      case SecurityLogLevel.INFO:
        return 'bg-info'
      default:
        return 'bg-secondary'
    }
  }

  const getEventIcon = (event: SecurityEventType) => {
    switch (event) {
      case SecurityEventType.LOGIN_ATTEMPT:
      case SecurityEventType.LOGIN_SUCCESS:
      case SecurityEventType.LOGIN_FAILURE:
        return 'bi-person-check'
      case SecurityEventType.LOGOUT:
        return 'bi-box-arrow-right'
      case SecurityEventType.UNAUTHORIZED_ACCESS:
      case SecurityEventType.ROLE_VIOLATION:
        return 'bi-shield-exclamation'
      case SecurityEventType.DATA_ACCESS:
        return 'bi-eye'
      case SecurityEventType.DATA_MODIFICATION:
        return 'bi-pencil-square'
      case SecurityEventType.FILE_UPLOAD:
        return 'bi-cloud-upload'
      case SecurityEventType.INVALID_INPUT:
        return 'bi-exclamation-triangle'
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
        return 'bi-speedometer2'
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return 'bi-bug'
      default:
        return 'bi-info-circle'
    }
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-shield-exclamation me-2"></i>
        Acceso denegado. Solo administradores pueden ver los logs de seguridad.
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-shield-check me-2"></i>
          Auditoría de Seguridad
        </h5>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={loadSecurityLogs}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualizar
          </button>
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={clearLogs}
          >
            <i className="bi bi-trash me-1"></i>
            Limpiar Logs
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <label className="form-label">Nivel</label>
            <select 
              className="form-select form-select-sm"
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
            >
              <option value="">Todos</option>
              {Object.values(SecurityLogLevel).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Evento</label>
            <select 
              className="form-select form-select-sm"
              value={filters.event}
              onChange={(e) => setFilters(prev => ({ ...prev, event: e.target.value }))}
            >
              <option value="">Todos</option>
              {Object.values(SecurityEventType).map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Usuario ID</label>
            <input 
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar..."
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Desde</label>
            <input 
              type="date"
              className="form-control form-control-sm"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Hasta</label>
            <input 
              type="date"
              className="form-control form-control-sm"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
          <div className="col-md-1 d-flex align-items-end">
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={clearFilters}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h6 className="card-title">Total Eventos</h6>
                <h4 className="text-primary">{filteredLogs.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h6 className="card-title">Críticos</h6>
                <h4 className="text-danger">
                  {filteredLogs.filter(log => log.level === SecurityLogLevel.CRITICAL).length}
                </h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h6 className="card-title">Errores</h6>
                <h4 className="text-warning">
                  {filteredLogs.filter(log => log.level === SecurityLogLevel.ERROR).length}
                </h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h6 className="card-title">Advertencias</h6>
                <h4 className="text-info">
                  {filteredLogs.filter(log => log.level === SecurityLogLevel.WARNING).length}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-inbox display-4"></i>
            <p className="mt-2">No hay logs de seguridad que mostrar</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Timestamp</th>
                  <th>Nivel</th>
                  <th>Evento</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>IP</th>
                  <th>Detalles</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="text-nowrap">
                      <small>{new Date(log.timestamp).toLocaleString()}</small>
                    </td>
                    <td>
                      <span className={`badge ${getLevelBadgeClass(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td>
                      <i className={`bi ${getEventIcon(log.event)} me-1`}></i>
                      <small>{log.event}</small>
                    </td>
                    <td>
                      <small>{log.userId ? log.userId.substring(0, 8) + '...' : 'N/A'}</small>
                    </td>
                    <td>
                      <small>{log.userRole || 'N/A'}</small>
                    </td>
                    <td>
                      <small>{log.ip || 'N/A'}</small>
                    </td>
                    <td>
                      <small>
                        {log.details ? (
                          <details>
                            <summary className="text-primary" style={{ cursor: 'pointer' }}>
                              Ver detalles
                            </summary>
                            <pre className="mt-2 p-2 bg-light rounded" style={{ fontSize: '0.75rem' }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : 'N/A'}
                      </small>
                    </td>
                    <td>
                      {log.success !== undefined && (
                        <span className={`badge ${log.success ? 'bg-success' : 'bg-danger'}`}>
                          {log.success ? 'Éxito' : 'Fallo'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
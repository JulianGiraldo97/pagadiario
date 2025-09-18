import { DailyCollectionSummary } from '@/lib/supabase/reports'

interface ReportsTableProps {
  data: DailyCollectionSummary[]
}

export default function ReportsTable({ data }: ReportsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-success'
    if (rate >= 60) return 'text-warning'
    return 'text-danger'
  }

  const calculateCollectionRate = (paid: number, total: number) => {
    return total > 0 ? (paid / total) * 100 : 0
  }

  const calculateEfficiency = (collected: number, expected: number) => {
    return expected > 0 ? (collected / expected) * 100 : 0
  }

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
          <h5 className="text-muted">No hay datos para mostrar</h5>
          <p className="text-muted">Ajusta los filtros para ver los reportes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-table me-2"></i>
          Detalle de Recaudación Diaria
        </h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Cobrador</th>
                <th>Clientes</th>
                <th>Pagaron</th>
                <th>No Pagaron</th>
                <th>Ausentes</th>
                <th>Tasa Cobro</th>
                <th>Recaudado</th>
                <th>Esperado</th>
                <th>Eficiencia</th>
              </tr>
            </thead>
            <tbody>
              {data.map((summary, index) => {
                const collectionRate = calculateCollectionRate(summary.clients_paid, summary.total_clients)
                const efficiency = calculateEfficiency(summary.total_collected, summary.total_expected)
                
                return (
                  <tr key={`${summary.collector_id}-${summary.route_date}-${index}`}>
                    <td>
                      <small className="text-muted">
                        {formatDate(summary.route_date)}
                      </small>
                    </td>
                    <td>
                      <strong>{summary.collector_name}</strong>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {summary.total_clients}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success">
                        {summary.clients_paid}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-danger">
                        {summary.clients_not_paid}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-warning">
                        {summary.clients_absent}
                      </span>
                    </td>
                    <td>
                      <span className={`fw-bold ${getCollectionRateColor(collectionRate)}`}>
                        {collectionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className="text-success fw-bold">
                        {formatCurrency(summary.total_collected)}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted">
                        {formatCurrency(summary.total_expected)}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className={`fw-bold me-2 ${getCollectionRateColor(efficiency)}`}>
                          {efficiency.toFixed(1)}%
                        </span>
                        <div className="progress flex-grow-1" style={{ height: '6px', width: '60px' }}>
                          <div 
                            className={`progress-bar ${efficiency >= 80 ? 'bg-success' : efficiency >= 60 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${Math.min(efficiency, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
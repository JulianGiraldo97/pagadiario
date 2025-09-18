interface MetricsCardsProps {
  metrics: {
    totalClients: number
    clientsPaid: number
    clientsNotPaid: number
    clientsAbsent: number
    totalCollected: number
    totalExpected: number
    collectionRate: number
    collectionEfficiency: number
  }
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`
  }

  return (
    <div className="row g-4 mb-4">
      <div className="col-md-3">
        <div className="card bg-primary text-white">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="card-title mb-0">Total Clientes</h6>
                <h3 className="mb-0">{metrics.totalClients.toLocaleString()}</h3>
              </div>
              <div className="fs-1 opacity-75">
                <i className="bi bi-people"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card bg-success text-white">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="card-title mb-0">Clientes Pagaron</h6>
                <h3 className="mb-0">{metrics.clientsPaid.toLocaleString()}</h3>
                <small className="opacity-75">
                  {formatPercentage(metrics.collectionRate)} tasa de cobro
                </small>
              </div>
              <div className="fs-1 opacity-75">
                <i className="bi bi-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card bg-info text-white">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="card-title mb-0">Total Recaudado</h6>
                <h3 className="mb-0">{formatCurrency(metrics.totalCollected)}</h3>
                <small className="opacity-75">
                  de {formatCurrency(metrics.totalExpected)} esperado
                </small>
              </div>
              <div className="fs-1 opacity-75">
                <i className="bi bi-currency-dollar"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card bg-warning text-dark">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="card-title mb-0">Eficiencia</h6>
                <h3 className="mb-0">{formatPercentage(metrics.collectionEfficiency)}</h3>
                <small className="opacity-75">
                  recaudado vs esperado
                </small>
              </div>
              <div className="fs-1 opacity-75">
                <i className="bi bi-graph-up"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card border-danger">
          <div className="card-body text-center">
            <h6 className="card-title text-danger">No Pagaron</h6>
            <h4 className="text-danger mb-0">{metrics.clientsNotPaid.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card border-warning">
          <div className="card-body text-center">
            <h6 className="card-title text-warning">Ausentes</h6>
            <h4 className="text-warning mb-0">{metrics.clientsAbsent.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card border-secondary">
          <div className="card-body text-center">
            <h6 className="card-title text-muted">Pendientes</h6>
            <h4 className="text-muted mb-0">
              {(metrics.clientsNotPaid + metrics.clientsAbsent).toLocaleString()}
            </h4>
          </div>
        </div>
      </div>
    </div>
  )
}
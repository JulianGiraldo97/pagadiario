'use client';

interface RouteProgressProps {
  total: number;
  visited: number;
  paid: number;
  notPaid: number;
  absent: number;
  totalCollected: number;
  totalExpected: number;
  isCompact?: boolean;
}

export default function RouteProgress({
  total,
  visited,
  paid,
  notPaid,
  absent,
  totalCollected,
  totalExpected,
  isCompact = false
}: RouteProgressProps) {
  
  const progressPercentage = total > 0 ? Math.round((visited / total) * 100) : 0;
  const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  if (isCompact) {
    return (
      <div className="card">
        <div className="card-body p-3">
          <h6 className="card-title mb-3">Progreso del Día</h6>
          
          <div className="text-center mb-3">
            <div className="display-6 text-primary mb-1">{visited}/{total}</div>
            <small className="text-muted">Clientes visitados</small>
          </div>

          <div className="progress mb-3" style={{ height: '8px' }}>
            <div 
              className="progress-bar bg-primary" 
              role="progressbar" 
              style={{ width: `${progressPercentage}%` }}
              aria-valuenow={progressPercentage} 
              aria-valuemin={0} 
              aria-valuemax={100}
            ></div>
          </div>

          <div className="row g-2 text-center">
            <div className="col-4">
              <div className="text-success fw-bold">{paid}</div>
              <small className="text-muted">Pagaron</small>
            </div>
            <div className="col-4">
              <div className="text-danger fw-bold">{notPaid}</div>
              <small className="text-muted">No pagaron</small>
            </div>
            <div className="col-4">
              <div className="text-secondary fw-bold">{absent}</div>
              <small className="text-muted">Ausentes</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-3">
      {/* Progress Overview */}
      <div className="col-md-6">
        <div className="card h-100">
          <div className="card-body">
            <h6 className="card-title mb-3">
              <i className="bi bi-list-check me-2"></i>
              Progreso de Visitas
            </h6>
            
            <div className="text-center mb-3">
              <div className="display-4 text-primary mb-2">{visited}/{total}</div>
              <div className="progress mb-2" style={{ height: '12px' }}>
                <div 
                  className="progress-bar bg-primary" 
                  role="progressbar" 
                  style={{ width: `${progressPercentage}%` }}
                  aria-valuenow={progressPercentage} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                ></div>
              </div>
              <small className="text-muted">{progressPercentage}% completado</small>
            </div>

            <div className="row g-2 text-center">
              <div className="col-4">
                <div className="p-2 bg-success bg-opacity-10 rounded">
                  <div className="text-success fw-bold fs-5">{paid}</div>
                  <small className="text-success">Pagaron</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 bg-danger bg-opacity-10 rounded">
                  <div className="text-danger fw-bold fs-5">{notPaid}</div>
                  <small className="text-danger">No pagaron</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 bg-secondary bg-opacity-10 rounded">
                  <div className="text-secondary fw-bold fs-5">{absent}</div>
                  <small className="text-secondary">Ausentes</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Summary */}
      <div className="col-md-6">
        <div className="card h-100">
          <div className="card-body">
            <h6 className="card-title mb-3">
              <i className="bi bi-cash-stack me-2"></i>
              Resumen de Recaudación
            </h6>
            
            <div className="text-center mb-3">
              <div className="display-6 text-success mb-2">
                ${totalCollected.toLocaleString()}
              </div>
              <div className="text-muted mb-2">
                de ${totalExpected.toLocaleString()} esperado
              </div>
              <div className="progress mb-2" style={{ height: '12px' }}>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${collectionPercentage}%` }}
                  aria-valuenow={collectionPercentage} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                ></div>
              </div>
              <small className="text-muted">{collectionPercentage}% del objetivo</small>
            </div>

            <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
              <span className="text-muted">Pendiente:</span>
              <span className="fw-bold text-warning">
                ${(totalExpected - totalCollected).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
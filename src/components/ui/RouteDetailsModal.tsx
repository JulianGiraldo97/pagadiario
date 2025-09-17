'use client';

import type { RouteWithAssignments } from '@/lib/types';

interface RouteDetailsModalProps {
  route: RouteWithAssignments | null;
  show: boolean;
  onHide: () => void;
}

export default function RouteDetailsModal({ route, show, onHide }: RouteDetailsModalProps) {
  if (!route || !show) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: 'bg-warning', text: 'Pendiente' },
      in_progress: { class: 'bg-info', text: 'En Progreso' },
      completed: { class: 'bg-success', text: 'Completada' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { class: 'bg-secondary', text: status };

    return (
      <span className={`badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const sortedAssignments = route.assignments?.sort((a, b) => 
    (a.visit_order || 0) - (b.visit_order || 0)
  ) || [];

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detalles de la Ruta</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title">Información General</h6>
                <div className="mb-2">
                  <strong>Fecha:</strong> {formatDate(route.route_date)}
                </div>
                <div className="mb-2">
                  <strong>Cobrador:</strong> {route.collector?.full_name || 'N/A'}
                </div>
                <div className="mb-2">
                  <strong>Estado:</strong> {getStatusBadge(route.status)}
                </div>
                <div className="mb-2">
                  <strong>Total de clientes:</strong> {sortedAssignments.length}
                </div>
                <div>
                  <strong>Creada:</strong> {new Date(route.created_at).toLocaleDateString('es-CO')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title">Estadísticas</h6>
                <div className="row text-center">
                  <div className="col-4">
                    <div className="border-end">
                      <div className="fs-4 fw-bold text-primary">{sortedAssignments.length}</div>
                      <small className="text-muted">Clientes</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border-end">
                      <div className="fs-4 fw-bold text-success">0</div>
                      <small className="text-muted">Visitados</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="fs-4 fw-bold text-warning">{sortedAssignments.length}</div>
                    <small className="text-muted">Pendientes</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h6 className="card-title mb-0">Clientes Asignados</h6>
          </div>
          <div className="card-body p-0">
            {sortedAssignments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted mb-0">No hay clientes asignados a esta ruta</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '60px' }}>Orden</th>
                      <th>Cliente</th>
                      <th>Dirección</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td>
                          <span className="badge bg-primary">
                            {assignment.visit_order || 0}
                          </span>
                        </td>
                        <td>
                          <strong>{assignment.client?.name || 'N/A'}</strong>
                        </td>
                        <td>
                          <span className="text-muted">
                            {assignment.client?.address || 'N/A'}
                          </span>
                        </td>
                        <td>
                          {assignment.client?.phone || 'N/A'}
                        </td>
                        <td>
                          <span className="badge bg-warning">Pendiente</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
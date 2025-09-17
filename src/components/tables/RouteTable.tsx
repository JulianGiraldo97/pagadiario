'use client';

import { useState, useMemo } from 'react';
import type { RouteWithAssignments } from '@/lib/types';

interface RouteTableProps {
  routes: RouteWithAssignments[];
  onView: (route: RouteWithAssignments) => void;
  onDelete: (route: RouteWithAssignments) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function RouteTable({ routes, onView, onDelete, isLoading = false }: RouteTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter routes based on search term and status
  const filteredRoutes = useMemo(() => {
    let filtered = routes;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(route => route.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(route => 
        route.collector?.full_name.toLowerCase().includes(term) ||
        route.route_date.includes(term)
      );
    }

    return filtered;
  }, [routes, searchTerm, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRoutes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRoutes = filteredRoutes.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  const canDeleteRoute = (route: RouteWithAssignments) => {
    // Only allow deletion of pending routes
    return route.status === 'pending';
  };

  const isRouteToday = (routeDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return routeDate === today;
  };

  const isRoutePast = (routeDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return routeDate < today;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col-md-4">
            <h5 className="card-title mb-0">
              Rutas Asignadas ({filteredRoutes.length})
            </h5>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              disabled={isLoading}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completadas</option>
            </select>
          </div>
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por cobrador o fecha..."
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron rutas que coincidan con los filtros' 
                : 'No hay rutas asignadas'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Cobrador</th>
                    <th>Clientes</th>
                    <th>Estado</th>
                    <th>Creada</th>
                    <th style={{ width: '120px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRoutes.map((route) => (
                    <tr key={route.id} className={isRouteToday(route.route_date) ? 'table-info' : ''}>
                      <td>
                        <div className="d-flex align-items-center">
                          <strong>{formatDate(route.route_date)}</strong>
                          {isRouteToday(route.route_date) && (
                            <span className="badge bg-primary ms-2">Hoy</span>
                          )}
                          {isRoutePast(route.route_date) && (
                            <span className="badge bg-secondary ms-2">Pasada</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{route.collector?.full_name || 'N/A'}</strong>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {route.assignments?.length || 0} clientes
                        </span>
                      </td>
                      <td>
                        {getStatusBadge(route.status)}
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(route.created_at)}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => onView(route)}
                            title="Ver detalles de la ruta"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {canDeleteRoute(route) && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => onDelete(route)}
                              title="Eliminar ruta"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredRoutes.length)} de {filteredRoutes.length} rutas
                  </small>
                  
                  <nav aria-label="Paginación de rutas">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </button>
                      </li>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
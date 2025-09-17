'use client';

import { useState, useMemo } from 'react';
import type { Client } from '@/lib/types';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function ClientTable({ clients, onEdit, onDelete, isLoading = false }: ClientTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    
    const term = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(term) ||
      client.address.toLowerCase().includes(term) ||
      (client.phone && client.phone.toLowerCase().includes(term))
    );
  }, [clients, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h5 className="card-title mb-0">
              Lista de Clientes ({filteredClients.length})
            </h5>
          </div>
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, dirección o teléfono..."
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
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">
              {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Fecha de Registro</th>
                    <th style={{ width: '120px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <strong>{client.name}</strong>
                      </td>
                      <td>
                        <span className="text-muted">{client.address}</span>
                      </td>
                      <td>
                        {formatPhone(client.phone)}
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(client.created_at)}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => onEdit(client)}
                            title="Editar cliente"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => onDelete(client)}
                            title="Eliminar cliente"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
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
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredClients.length)} de {filteredClients.length} clientes
                  </small>
                  
                  <nav aria-label="Paginación de clientes">
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
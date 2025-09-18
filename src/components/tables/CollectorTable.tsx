'use client';

import { useState } from 'react';
import { deleteCollector, resetCollectorPassword } from '@/lib/supabase/collectors';
import type { Profile } from '@/lib/types';

interface CollectorTableProps {
  collectors: Profile[];
  onEdit: (collector: Profile) => void;
  onDelete: (collectorId: string) => void;
  loading?: boolean;
}

export default function CollectorTable({ collectors, onEdit, onDelete, loading = false }: CollectorTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleDelete = async (collector: Profile) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al cobrador "${collector.full_name}"?`)) {
      return;
    }

    setDeletingId(collector.id);
    
    try {
      const result = await deleteCollector(collector.id);
      
      if (result.error) {
        alert(`Error al eliminar cobrador: ${result.error}`);
        return;
      }

      onDelete(collector.id);
    } catch (error) {
      alert(`Error al eliminar cobrador: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = (collector: Profile) => {
    setSelectedCollector(collector);
    setNewPassword('');
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  const handlePasswordReset = async () => {
    if (!selectedCollector) return;

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setResettingPasswordId(selectedCollector.id);
    setPasswordError(null);

    try {
      const result = await resetCollectorPassword(selectedCollector.id, newPassword);
      
      if (result.error) {
        setPasswordError(result.error);
        return;
      }

      alert('Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setSelectedCollector(null);
      setNewPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setResettingPasswordId(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (collectors.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-people display-1 text-muted mb-3"></i>
        <h5 className="text-muted">No hay cobradores registrados</h5>
        <p className="text-muted">Crea el primer cobrador para comenzar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Fecha de Registro</th>
              <th>Última Actualización</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {collectors.map((collector) => (
              <tr key={collector.id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                      {collector.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-bold">{collector.full_name}</div>
                      <small className="text-muted">Cobrador</small>
                    </div>
                  </div>
                </td>
                <td>{collector.email}</td>
                <td>
                  <small className="text-muted">
                    {new Date(collector.created_at).toLocaleDateString()}
                  </small>
                </td>
                <td>
                  <small className="text-muted">
                    {new Date(collector.updated_at).toLocaleDateString()}
                  </small>
                </td>
                <td>
                  <div className="d-flex gap-1 justify-content-center">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(collector)}
                      title="Editar cobrador"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => handleResetPassword(collector)}
                      title="Resetear contraseña"
                    >
                      <i className="bi bi-key"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(collector)}
                      disabled={deletingId === collector.id}
                      title="Eliminar cobrador"
                    >
                      {deletingId === collector.id ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-trash"></i>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Resetear Contraseña - {selectedCollector?.full_name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={resettingPasswordId !== null}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    disabled={resettingPasswordId !== null}
                  />
                  <div className="form-text">
                    Mínimo 6 caracteres
                  </div>
                </div>

                {passwordError && (
                  <div className="alert alert-danger" role="alert">
                    {passwordError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={resettingPasswordId !== null}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePasswordReset}
                  disabled={resettingPasswordId !== null || !newPassword}
                >
                  {resettingPasswordId ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Contraseña'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .avatar-sm {
          width: 32px;
          height: 32px;
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
}
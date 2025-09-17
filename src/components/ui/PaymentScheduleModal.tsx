'use client';

import { useEffect, useState } from 'react';
import type { DebtWithSchedule } from '@/lib/supabase/debts';
import type { PaymentSchedule } from '@/lib/types';

interface PaymentScheduleModalProps {
  debt: DebtWithSchedule | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateScheduleStatus?: (scheduleId: string, status: 'pending' | 'paid' | 'overdue') => Promise<void>;
}

export default function PaymentScheduleModal({ 
  debt, 
  isOpen, 
  onClose, 
  onUpdateScheduleStatus 
}: PaymentScheduleModalProps) {
  const [updatingSchedule, setUpdatingSchedule] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleStatusUpdate = async (scheduleId: string, status: 'pending' | 'paid' | 'overdue') => {
    if (!onUpdateScheduleStatus) return;
    
    setUpdatingSchedule(scheduleId);
    try {
      await onUpdateScheduleStatus(scheduleId, status);
    } finally {
      setUpdatingSchedule(null);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = status === 'pending' && dueDate < today;
    
    if (isOverdue) {
      return <span className="badge bg-danger">Vencido</span>;
    }
    
    const statusClasses = {
      pending: 'bg-warning text-dark',
      paid: 'bg-success',
      overdue: 'bg-danger'
    };
    
    const statusLabels = {
      pending: 'Pendiente',
      paid: 'Pagado',
      overdue: 'Vencido'
    };

    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'bg-secondary'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  const calculateSummary = () => {
    if (!debt?.payment_schedule) return { total: 0, paid: 0, pending: 0, overdue: 0 };

    const today = new Date().toISOString().split('T')[0];
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    debt.payment_schedule.forEach(schedule => {
      totalAmount += schedule.amount;
      
      if (schedule.status === 'paid') {
        paidAmount += schedule.amount;
      } else if (schedule.status === 'pending') {
        if (schedule.due_date < today) {
          overdueAmount += schedule.amount;
        } else {
          pendingAmount += schedule.amount;
        }
      } else if (schedule.status === 'overdue') {
        overdueAmount += schedule.amount;
      }
    });

    return { total: totalAmount, paid: paidAmount, pending: pendingAmount, overdue: overdueAmount };
  };

  if (!isOpen || !debt) return null;

  const summary = calculateSummary();
  const sortedSchedule = debt.payment_schedule?.sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  ) || [];

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={onClose}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex={-1} 
        style={{ zIndex: 1050 }}
        role="dialog"
        aria-labelledby="paymentScheduleModalLabel"
        aria-hidden="false"
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="paymentScheduleModalLabel">
                Cronograma de Pagos - {debt.client?.name}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            
            <div className="modal-body">
              {/* Debt Information */}
              <div className="card mb-4">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Información de la Deuda</h6>
                      <p className="mb-1"><strong>Cliente:</strong> {debt.client?.name}</p>
                      <p className="mb-1"><strong>Dirección:</strong> {debt.client?.address}</p>
                      <p className="mb-1"><strong>Monto Total:</strong> ${debt.total_amount.toFixed(2)}</p>
                      <p className="mb-1"><strong>Cuota:</strong> ${debt.installment_amount.toFixed(2)}</p>
                      <p className="mb-1"><strong>Frecuencia:</strong> {debt.frequency === 'daily' ? 'Diario' : 'Semanal'}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Resumen de Pagos</h6>
                      <div className="row text-center">
                        <div className="col-6 mb-2">
                          <div className="border rounded p-2">
                            <div className="text-success h5 mb-0">${summary.paid.toFixed(2)}</div>
                            <small className="text-muted">Pagado</small>
                          </div>
                        </div>
                        <div className="col-6 mb-2">
                          <div className="border rounded p-2">
                            <div className="text-warning h5 mb-0">${summary.pending.toFixed(2)}</div>
                            <small className="text-muted">Pendiente</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded p-2">
                            <div className="text-danger h5 mb-0">${summary.overdue.toFixed(2)}</div>
                            <small className="text-muted">Vencido</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded p-2 bg-light">
                            <div className="h5 mb-0">${summary.total.toFixed(2)}</div>
                            <small className="text-muted">Total</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Schedule Table */}
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Cuota #</th>
                      <th>Fecha Vencimiento</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Días</th>
                      {onUpdateScheduleStatus && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSchedule.map((schedule, index) => {
                      const today = new Date();
                      const dueDate = new Date(schedule.due_date);
                      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const isOverdue = schedule.status === 'pending' && daysDiff < 0;
                      
                      return (
                        <tr key={schedule.id} className={isOverdue ? 'table-danger' : ''}>
                          <td>
                            <strong>#{index + 1}</strong>
                          </td>
                          <td>
                            {new Date(schedule.due_date).toLocaleDateString('es-ES')}
                          </td>
                          <td>
                            <strong>${schedule.amount.toFixed(2)}</strong>
                          </td>
                          <td>
                            {getStatusBadge(schedule.status, schedule.due_date)}
                          </td>
                          <td>
                            {schedule.status === 'paid' ? (
                              <span className="text-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Pagado
                              </span>
                            ) : daysDiff < 0 ? (
                              <span className="text-danger">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                {Math.abs(daysDiff)} días vencido
                              </span>
                            ) : daysDiff === 0 ? (
                              <span className="text-warning">
                                <i className="bi bi-clock me-1"></i>
                                Vence hoy
                              </span>
                            ) : (
                              <span className="text-muted">
                                En {daysDiff} días
                              </span>
                            )}
                          </td>
                          {onUpdateScheduleStatus && (
                            <td>
                              {schedule.status === 'pending' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleStatusUpdate(schedule.id, 'paid')}
                                  disabled={updatingSchedule === schedule.id}
                                  title="Marcar como pagado"
                                >
                                  {updatingSchedule === schedule.id ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <i className="bi bi-check"></i>
                                  )}
                                </button>
                              )}
                              {schedule.status === 'paid' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => handleStatusUpdate(schedule.id, 'pending')}
                                  disabled={updatingSchedule === schedule.id}
                                  title="Marcar como pendiente"
                                >
                                  {updatingSchedule === schedule.id ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                  )}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
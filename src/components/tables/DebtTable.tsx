'use client';

import { useState } from 'react';
import type { DebtWithSchedule } from '@/lib/supabase/debts';

interface DebtTableProps {
  debts: DebtWithSchedule[];
  onViewSchedule: (debt: DebtWithSchedule) => void;
  onUpdateStatus: (debtId: string, status: 'active' | 'completed' | 'cancelled') => Promise<void>;
  isLoading?: boolean;
}

export default function DebtTable({ debts, onViewSchedule, onUpdateStatus, isLoading = false }: DebtTableProps) {
  const [updatingDebt, setUpdatingDebt] = useState<string | null>(null);

  const handleStatusUpdate = async (debtId: string, status: 'active' | 'completed' | 'cancelled') => {
    setUpdatingDebt(debtId);
    try {
      await onUpdateStatus(debtId, status);
    } finally {
      setUpdatingDebt(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-success',
      completed: 'bg-primary',
      cancelled: 'bg-danger'
    };
    
    const statusLabels = {
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };

    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'bg-secondary'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency === 'daily' ? 'Diario' : 'Semanal';
  };

  const calculateProgress = (debt: DebtWithSchedule) => {
    if (!debt.payment_schedule || debt.payment_schedule.length === 0) {
      return { paid: 0, total: 0, percentage: 0 };
    }

    const paidSchedules = debt.payment_schedule.filter(s => s.status === 'paid');
    const totalSchedules = debt.payment_schedule.length;
    const percentage = totalSchedules > 0 ? (paidSchedules.length / totalSchedules) * 100 : 0;

    return {
      paid: paidSchedules.length,
      total: totalSchedules,
      percentage: Math.round(percentage)
    };
  };

  const calculateAmounts = (debt: DebtWithSchedule) => {
    if (!debt.payment_schedule || debt.payment_schedule.length === 0) {
      return { paid: 0, pending: debt.total_amount, overdue: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    debt.payment_schedule.forEach(schedule => {
      if (schedule.status === 'paid') {
        paidAmount += schedule.amount;
      } else if (schedule.status === 'pending') {
        if (schedule.due_date < today) {
          overdueAmount += schedule.amount;
        } else {
          pendingAmount += schedule.amount;
        }
      }
    });

    return { paid: paidAmount, pending: pendingAmount, overdue: overdueAmount };
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="text-center p-4">
        <i className="bi bi-inbox display-1 text-muted"></i>
        <h5 className="mt-3 text-muted">No hay deudas registradas</h5>
        <p className="text-muted">Las deudas aparecerán aquí una vez que sean creadas.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-dark">
          <tr>
            <th>Cliente</th>
            <th>Monto Total</th>
            <th>Cuota</th>
            <th>Frecuencia</th>
            <th>Progreso</th>
            <th>Montos</th>
            <th>Estado</th>
            <th>Fecha Inicio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {debts.map((debt) => {
            const progress = calculateProgress(debt);
            const amounts = calculateAmounts(debt);
            
            return (
              <tr key={debt.id}>
                <td>
                  <div>
                    <strong>{debt.client?.name}</strong>
                    <br />
                    <small className="text-muted">{debt.client?.address}</small>
                  </div>
                </td>
                <td>
                  <strong>${debt.total_amount.toFixed(2)}</strong>
                </td>
                <td>
                  ${debt.installment_amount.toFixed(2)}
                </td>
                <td>
                  <span className="badge bg-info">
                    {getFrequencyLabel(debt.frequency)}
                  </span>
                </td>
                <td>
                  <div className="progress mb-1" style={{ height: '20px' }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${progress.percentage}%` }}
                      aria-valuenow={progress.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {progress.percentage}%
                    </div>
                  </div>
                  <small className="text-muted">
                    {progress.paid} de {progress.total} cuotas
                  </small>
                </td>
                <td>
                  <div className="small">
                    <div className="text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      Pagado: ${amounts.paid.toFixed(2)}
                    </div>
                    <div className="text-warning">
                      <i className="bi bi-clock me-1"></i>
                      Pendiente: ${amounts.pending.toFixed(2)}
                    </div>
                    {amounts.overdue > 0 && (
                      <div className="text-danger">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Vencido: ${amounts.overdue.toFixed(2)}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {getStatusBadge(debt.status)}
                </td>
                <td>
                  {new Date(debt.start_date).toLocaleDateString('es-ES')}
                </td>
                <td>
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onViewSchedule(debt)}
                      title="Ver cronograma"
                    >
                      <i className="bi bi-calendar-check"></i>
                    </button>
                    
                    {debt.status === 'active' && (
                      <div className="btn-group" role="group">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary dropdown-toggle"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          disabled={updatingDebt === debt.id}
                        >
                          {updatingDebt === debt.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <i className="bi bi-gear"></i>
                          )}
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleStatusUpdate(debt.id, 'completed')}
                            >
                              <i className="bi bi-check-circle me-2 text-success"></i>
                              Marcar como Completada
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleStatusUpdate(debt.id, 'cancelled')}
                            >
                              <i className="bi bi-x-circle me-2 text-danger"></i>
                              Cancelar Deuda
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
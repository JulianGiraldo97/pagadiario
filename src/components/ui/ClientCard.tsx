'use client';

import { useState } from 'react';
import type { RouteAssignmentWithDetails } from '@/lib/types';

interface ClientCardProps {
  assignment: RouteAssignmentWithDetails;
  onPaymentClick: (assignment: RouteAssignmentWithDetails) => void;
  isOptimizedForMobile?: boolean;
}

export default function ClientCard({ assignment, onPaymentClick, isOptimizedForMobile = false }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const client = assignment.client;
  const paymentSchedule = assignment.payment_schedule;
  const payment = assignment.payment;
  
  if (!client) return null;

  const getStatusBadge = () => {
    if (!payment) {
      return <span className="badge bg-warning">Pendiente</span>;
    }
    
    switch (payment.payment_status) {
      case 'paid':
        return <span className="badge bg-success">Pagado</span>;
      case 'not_paid':
        return <span className="badge bg-danger">No Pagó</span>;
      case 'client_absent':
        return <span className="badge bg-secondary">Ausente</span>;
      default:
        return <span className="badge bg-warning">Pendiente</span>;
    }
  };

  const getStatusIcon = () => {
    if (!payment) {
      return <i className="bi bi-clock text-warning"></i>;
    }
    
    switch (payment.payment_status) {
      case 'paid':
        return <i className="bi bi-check-circle-fill text-success"></i>;
      case 'not_paid':
        return <i className="bi bi-x-circle-fill text-danger"></i>;
      case 'client_absent':
        return <i className="bi bi-person-slash text-secondary"></i>;
      default:
        return <i className="bi bi-clock text-warning"></i>;
    }
  };

  const cardClass = isOptimizedForMobile 
    ? "card mb-3 shadow-sm" 
    : "card mb-3";

  return (
    <div className={cardClass}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <h6 className="card-title mb-1 d-flex align-items-center">
              <span className="me-2">{getStatusIcon()}</span>
              {client.name}
              {assignment.visit_order && (
                <span className="badge bg-light text-dark ms-2">#{assignment.visit_order}</span>
              )}
            </h6>
            <p className="card-text text-muted small mb-1">
              <i className="bi bi-geo-alt me-1"></i>
              {client.address}
            </p>
            {client.phone && (
              <p className="card-text text-muted small mb-2">
                <i className="bi bi-telephone me-1"></i>
                <a href={`tel:${client.phone}`} className="text-decoration-none">
                  {client.phone}
                </a>
              </p>
            )}
          </div>
          <div className="text-end">
            {getStatusBadge()}
          </div>
        </div>

        {paymentSchedule && (
          <div className="row g-2 mb-3">
            <div className="col-6">
              <small className="text-muted">Monto a cobrar:</small>
              <div className="fw-bold text-primary">
                ${paymentSchedule.amount.toLocaleString()}
              </div>
            </div>
            {payment && payment.payment_status === 'paid' && (
              <div className="col-6">
                <small className="text-muted">Monto recibido:</small>
                <div className="fw-bold text-success">
                  ${(payment.amount_paid || 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        {payment && payment.notes && (
          <div className="mb-3">
            <small className="text-muted">Notas:</small>
            <p className="small mb-0">{payment.notes}</p>
          </div>
        )}

        {payment && payment.recorded_at && (
          <div className="mb-3">
            <small className="text-muted">
              Registrado: {new Date(payment.recorded_at).toLocaleString()}
            </small>
          </div>
        )}

        <div className="d-flex gap-2">
          {!payment && (
            <button
              className="btn btn-primary btn-sm flex-grow-1"
              onClick={() => onPaymentClick(assignment)}
            >
              <i className="bi bi-cash me-1"></i>
              Registrar Pago
            </button>
          )}
          
          {isOptimizedForMobile && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          )}
        </div>

        {isExpanded && isOptimizedForMobile && (
          <div className="mt-3 pt-3 border-top">
            <div className="row g-2">
              <div className="col-12">
                <small className="text-muted">Información adicional:</small>
              </div>
              {paymentSchedule && (
                <div className="col-12">
                  <small>Fecha vencimiento: {new Date(paymentSchedule.due_date).toLocaleDateString()}</small>
                </div>
              )}
              {payment && payment.evidence_photo_url && (
                <div className="col-12">
                  <small className="text-muted">Evidencia disponible</small>
                  <i className="bi bi-camera ms-1"></i>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
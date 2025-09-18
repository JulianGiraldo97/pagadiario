'use client';

import { useState } from 'react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import type { PaymentStatus } from '@/lib/types';

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  clientName: string;
  paymentStatus: PaymentStatus;
  amount?: number;
  isUpdate?: boolean;
}

export default function PaymentConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  paymentStatus,
  amount,
  isUpdate = false
}: PaymentConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (paymentStatus) {
      case 'paid':
        return {
          icon: 'bi-check-circle',
          color: 'text-success',
          title: 'Pago Recibido',
          message: `Se registrará que ${clientName} realizó el pago${amount ? ` de $${amount.toLocaleString()}` : ''}.`
        };
      case 'not_paid':
        return {
          icon: 'bi-x-circle',
          color: 'text-danger',
          title: 'No Pagó',
          message: `Se registrará que ${clientName} no realizó el pago.`
        };
      case 'client_absent':
        return {
          icon: 'bi-person-x',
          color: 'text-warning',
          title: 'Cliente Ausente',
          message: `Se registrará que ${clientName} no se encontraba en el domicilio.`
        };
      default:
        return {
          icon: 'bi-question-circle',
          color: 'text-muted',
          title: 'Confirmar',
          message: 'Se registrará la información proporcionada.'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="sm"
      title={`${isUpdate ? 'Actualizar' : 'Confirmar'} ${statusInfo.title}`}
    >
      <div className="text-center mb-3">
        <i className={`${statusInfo.icon} ${statusInfo.color} display-4`}></i>
      </div>
      
      <p className="text-center mb-3">
        {statusInfo.message}
      </p>

      {paymentStatus !== 'paid' && (
        <div className="alert alert-info">
          <small>
            <i className="bi bi-info-circle me-1"></i>
            Se recomienda adjuntar una foto como evidencia.
          </small>
        </div>
      )}
      
      <div className="d-flex gap-2 justify-content-end">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={`btn btn-${paymentStatus === 'paid' ? 'success' : paymentStatus === 'not_paid' ? 'danger' : 'warning'}`}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="me-2" />
              {isUpdate ? 'Actualizando...' : 'Registrando...'}
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2"></i>
              {isUpdate ? 'Actualizar' : 'Confirmar'}
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
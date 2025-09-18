'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCollectorDailyRoute } from '@/lib/supabase/routes';
import { getPaymentByAssignment } from '@/lib/supabase/payments';
import PaymentForm from '@/components/forms/PaymentForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { RouteAssignmentWithDetails, Payment } from '@/lib/types';

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  
  const [assignment, setAssignment] = useState<RouteAssignmentWithDetails | null>(null);
  const [existingPayment, setExistingPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get URL parameters
  const assignmentId = searchParams.get('assignmentId');
  const clientId = searchParams.get('clientId');
  const clientName = searchParams.get('clientName');
  const paymentScheduleId = searchParams.get('paymentScheduleId');

  const loadAssignmentData = useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    setError(null);

    try {
      // Get route assignments to find the specific one
      const routeResult = await getCollectorDailyRoute();
      if (routeResult.error) {
        setError(routeResult.error);
        return;
      }

      const foundAssignment = routeResult.data.find(a => a.id === assignmentId);
      if (!foundAssignment) {
        setError('Asignación no encontrada');
        return;
      }

      setAssignment(foundAssignment);

      // Check if payment already exists
      const paymentResult = await getPaymentByAssignment(assignmentId);
      if (paymentResult.error) {
        console.error('Error loading existing payment:', paymentResult.error);
      } else {
        setExistingPayment(paymentResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId) {
      setError('ID de asignación no proporcionado');
      setLoading(false);
      return;
    }

    loadAssignmentData();
  }, [assignmentId, loadAssignmentData]);

  const handlePaymentSuccess = (payment: Payment) => {
    // Navigate back to collector dashboard with success message
    const params = new URLSearchParams({
      success: 'true',
      message: existingPayment ? 'Pago actualizado correctamente' : 'Pago registrado correctamente'
    });
    
    router.push(`/collector?${params.toString()}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Asignación no encontrada</h4>
          <p>No se pudo encontrar la información de la visita.</p>
          <button className="btn btn-outline-warning" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const expectedAmount = assignment.payment_schedule?.amount || 0;
  const displayClientName = assignment.client?.name || clientName || 'Cliente';

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-outline-secondary me-3"
          onClick={handleCancel}
        >
          <i className="bi bi-arrow-left"></i>
          {!isMobile && <span className="ms-1">Volver</span>}
        </button>
        <div>
          <h2 className="mb-0">
            {existingPayment ? 'Editar Registro' : 'Registrar Pago'}
          </h2>
          <small className="text-muted">
            {assignment.client?.address}
          </small>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="row g-4">
        <div className="col-lg-8">
          {assignmentId && (
            <PaymentForm
              assignmentId={assignmentId}
              paymentScheduleId={paymentScheduleId || assignment.payment_schedule_id}
              clientName={displayClientName}
              expectedAmount={expectedAmount}
              existingPayment={existingPayment}
              onSuccess={handlePaymentSuccess}
              onCancel={handleCancel}
            />
          )}
        </div>

        {/* Client Info Sidebar */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-person me-2"></i>
                Información del Cliente
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Nombre:</strong>
                <div>{displayClientName}</div>
              </div>
              
              <div className="mb-3">
                <strong>Dirección:</strong>
                <div className="text-muted">{assignment.client?.address}</div>
              </div>

              {assignment.client?.phone && (
                <div className="mb-3">
                  <strong>Teléfono:</strong>
                  <div>
                    <a href={`tel:${assignment.client.phone}`} className="text-decoration-none">
                      <i className="bi bi-telephone me-1"></i>
                      {assignment.client.phone}
                    </a>
                  </div>
                </div>
              )}

              {expectedAmount > 0 && (
                <div className="mb-3">
                  <strong>Monto Esperado:</strong>
                  <div className="fs-5 text-primary">
                    ${expectedAmount.toLocaleString()}
                  </div>
                </div>
              )}

              {assignment.payment_schedule?.due_date && (
                <div className="mb-3">
                  <strong>Fecha de Vencimiento:</strong>
                  <div>{new Date(assignment.payment_schedule.due_date).toLocaleDateString()}</div>
                </div>
              )}

              {existingPayment && (
                <div className="alert alert-info">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    Registro previo: {new Date(existingPayment.recorded_at).toLocaleString()}
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {assignment.client?.phone && (
            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="bi bi-telephone me-2"></i>
                  Acciones Rápidas
                </h6>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <a
                    href={`tel:${assignment.client.phone}`}
                    className="btn btn-outline-primary"
                  >
                    <i className="bi bi-telephone me-2"></i>
                    Llamar Cliente
                  </a>
                  <a
                    href={`sms:${assignment.client.phone}`}
                    className="btn btn-outline-info"
                  >
                    <i className="bi bi-chat-text me-2"></i>
                    Enviar SMS
                  </a>
                  <a
                    href={`https://wa.me/${assignment.client.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-success"
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
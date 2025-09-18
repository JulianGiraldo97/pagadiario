'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { recordPayment, updatePayment } from '@/lib/supabase/payments';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { RecordPaymentForm, Payment, PaymentStatus } from '@/lib/types';

interface PaymentFormProps {
  assignmentId: string;
  paymentScheduleId?: string;
  clientName: string;
  expectedAmount?: number;
  existingPayment?: Payment | null;
  onSuccess: (payment: Payment) => void;
  onCancel: () => void;
}

interface FormData {
  amount_paid: number;
  payment_status: PaymentStatus;
  notes: string;
  evidence_photo?: FileList;
}

export default function PaymentForm({
  assignmentId,
  paymentScheduleId,
  clientName,
  expectedAmount = 0,
  existingPayment,
  onSuccess,
  onCancel
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(
    existingPayment?.evidence_photo_url || null
  );


  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      amount_paid: existingPayment?.amount_paid || expectedAmount,
      payment_status: existingPayment?.payment_status || 'paid',
      notes: existingPayment?.notes || ''
    }
  });

  const paymentStatus = watch('payment_status');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    const fileInput = document.getElementById('evidence_photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const paymentData: RecordPaymentForm = {
        route_assignment_id: assignmentId,
        payment_schedule_id: paymentScheduleId,
        amount_paid: data.payment_status === 'paid' ? data.amount_paid : undefined,
        payment_status: data.payment_status,
        evidence_photo: data.evidence_photo?.[0],
        notes: data.notes.trim() || undefined
      };

      let result;
      if (existingPayment) {
        result = await updatePayment(existingPayment.id, paymentData);
      } else {
        result = await recordPayment(paymentData);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        onSuccess(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-cash me-2"></i>
          {existingPayment ? 'Editar Registro' : 'Registrar Pago'}
        </h5>
        <small className="text-muted">Cliente: {clientName}</small>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Payment Status */}
          <div className="mb-3">
            <label className="form-label">Estado del Pago *</label>
            <div className="row g-2">
              <div className="col-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    value="paid"
                    {...register('payment_status', { required: 'Selecciona el estado del pago' })}
                  />
                  <label className="form-check-label text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Pagó
                  </label>
                </div>
              </div>
              <div className="col-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    value="not_paid"
                    {...register('payment_status', { required: 'Selecciona el estado del pago' })}
                  />
                  <label className="form-check-label text-danger">
                    <i className="bi bi-x-circle me-1"></i>
                    No Pagó
                  </label>
                </div>
              </div>
              <div className="col-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    value="client_absent"
                    {...register('payment_status', { required: 'Selecciona el estado del pago' })}
                  />
                  <label className="form-check-label text-warning">
                    <i className="bi bi-person-x me-1"></i>
                    Ausente
                  </label>
                </div>
              </div>
            </div>
            {errors.payment_status && (
              <div className="text-danger small mt-1">{errors.payment_status.message}</div>
            )}
          </div>

          {/* Amount Paid - Only show if status is 'paid' */}
          {paymentStatus === 'paid' && (
            <div className="mb-3">
              <label htmlFor="amount_paid" className="form-label">
                Monto Recibido *
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className={`form-control ${errors.amount_paid ? 'is-invalid' : ''}`}
                  id="amount_paid"
                  step="0.01"
                  min="0"
                  {...register('amount_paid', {
                    required: paymentStatus === 'paid' ? 'Ingresa el monto recibido' : false,
                    min: { value: 0, message: 'El monto debe ser mayor a 0' },
                    valueAsNumber: true
                  })}
                />
              </div>
              {expectedAmount > 0 && (
                <div className="form-text">
                  Monto esperado: ${expectedAmount.toLocaleString()}
                  {expectedAmount > 0 && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 ms-2"
                      onClick={() => setValue('amount_paid', expectedAmount)}
                    >
                      Usar monto esperado
                    </button>
                  )}
                </div>
              )}
              {errors.amount_paid && (
                <div className="invalid-feedback">{errors.amount_paid.message}</div>
              )}
            </div>
          )}

          {/* Evidence Photo */}
          <div className="mb-3">
            <label htmlFor="evidence_photo" className="form-label">
              Foto de Evidencia
              {paymentStatus !== 'paid' && <span className="text-danger"> *</span>}
            </label>
            
            {previewImage && (
              <div className="mb-2">
                <div className="position-relative d-inline-block">
                  <img
                    src={previewImage}
                    alt="Vista previa"
                    className="img-thumbnail"
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0"
                    style={{ transform: 'translate(50%, -50%)' }}
                    onClick={removeImage}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              </div>
            )}

            <input
              type="file"
              className="form-control"
              id="evidence_photo"
              accept="image/*"
              capture="environment"
              {...register('evidence_photo', {
                required: paymentStatus !== 'paid' && !previewImage ? 'La foto de evidencia es requerida' : false
              })}
              onChange={handleImageChange}
            />
            <div className="form-text">
              {paymentStatus === 'paid' 
                ? 'Opcional: Foto del recibo o comprobante'
                : 'Requerido: Foto de la casa, negocio o situación encontrada'
              }
            </div>
            {errors.evidence_photo && (
              <div className="text-danger small mt-1">{errors.evidence_photo.message}</div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label htmlFor="notes" className="form-label">Observaciones</label>
            <textarea
              className="form-control"
              id="notes"
              rows={3}
              placeholder="Detalles adicionales sobre la visita..."
              {...register('notes')}
            />
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary flex-grow-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="me-2" />
                  {existingPayment ? 'Actualizando...' : 'Registrando...'}
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {existingPayment ? 'Actualizar' : 'Registrar'}
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
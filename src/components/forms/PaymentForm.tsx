'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { recordPayment, updatePayment } from '@/lib/supabase/payments';
import { getInstallmentDetails } from '@/lib/supabase/debts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { RecordPaymentForm, Payment, PaymentStatus } from '@/lib/types';
import { 
  validatePaymentForm, 
  validateFileUpload,
  sanitizeAmount,
  sanitizeString,
  securityLogger,
  SecurityLogLevel,
  SecurityEventType
} from '@/lib/utils/security';

interface PaymentFormProps {
  assignmentId: string;
  paymentScheduleId?: string;
  clientName: string;
  expectedAmount?: number;
  existingPayment?: Payment | null;
  onSuccess: (payment: Payment) => void;
  onCancel: () => void;
}

interface InstallmentInfo {
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  status: string;
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
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(
    existingPayment?.evidence_photo_url || null
  );
  const [installmentInfo, setInstallmentInfo] = useState<InstallmentInfo | null>(null);
  const [loadingInstallment, setLoadingInstallment] = useState(false);

  // Load installment details when component mounts
  useEffect(() => {
    if (paymentScheduleId) {
      setLoadingInstallment(true);
      getInstallmentDetails(paymentScheduleId)
        .then(info => {
          if (info) {
            setInstallmentInfo(info);
          }
        })
        .catch(err => {
          console.error('Error loading installment details:', err);
        })
        .finally(() => {
          setLoadingInstallment(false);
        });
    }
  }, [paymentScheduleId]);


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
      try {
        // Enhanced security validation
        validateFileUpload(file);
        
        // Log file upload attempt
        securityLogger.log({
          level: SecurityLogLevel.INFO,
          event: SecurityEventType.FILE_UPLOAD,
          userId: user?.id,
          userRole: profile?.role,
          details: { 
            action: 'payment_evidence_upload',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            assignmentId
          }
        });

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error de validación de archivo';
        setError(errorMessage);
        
        // Log validation failure
        securityLogger.log({
          level: SecurityLogLevel.WARNING,
          event: SecurityEventType.INVALID_INPUT,
          userId: user?.id,
          userRole: profile?.role,
          details: { 
            action: 'file_validation_failed',
            error: errorMessage,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }
        });
      }
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
      // Log payment submission attempt
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.DATA_MODIFICATION,
        userId: user?.id,
        userRole: profile?.role,
        details: { 
          action: existingPayment ? 'update_payment' : 'record_payment',
          assignmentId,
          paymentStatus: data.payment_status,
          paymentId: existingPayment?.id
        }
      });

      // Validate payment form data
      const formValidation = validatePaymentForm({
        route_assignment_id: assignmentId,
        payment_schedule_id: paymentScheduleId,
        amount_paid: data.payment_status === 'paid' ? data.amount_paid : undefined,
        payment_status: data.payment_status,
        notes: data.notes
      });

      if (!formValidation.isValid) {
        setError('Datos de formulario inválidos: ' + Object.values(formValidation.errors).join(', '));
        
        // Log validation failure
        securityLogger.log({
          level: SecurityLogLevel.WARNING,
          event: SecurityEventType.INVALID_INPUT,
          userId: user?.id,
          userRole: profile?.role,
          details: { 
            action: 'payment_form_validation_failed',
            errors: formValidation.errors
          }
        });
        
        return;
      }

      // Sanitize and prepare payment data
      const paymentData: RecordPaymentForm = {
        route_assignment_id: assignmentId,
        payment_schedule_id: paymentScheduleId,
        amount_paid: data.payment_status === 'paid' ? sanitizeAmount(data.amount_paid) : undefined,
        payment_status: data.payment_status,
        evidence_photo: data.evidence_photo?.[0],
        notes: data.notes.trim() ? sanitizeString(data.notes.trim(), 1000) : undefined
      };

      // Additional file validation if present
      if (paymentData.evidence_photo) {
        validateFileUpload(paymentData.evidence_photo);
      }

      let result;
      if (existingPayment) {
        result = await updatePayment(existingPayment.id, paymentData);
      } else {
        result = await recordPayment(paymentData);
      }

      if (result.error) {
        setError(result.error);
        
        // Log submission error
        securityLogger.log({
          level: SecurityLogLevel.ERROR,
          event: SecurityEventType.DATA_MODIFICATION,
          userId: user?.id,
          userRole: profile?.role,
          success: false,
          details: { 
            action: existingPayment ? 'update_payment_error' : 'record_payment_error',
            error: result.error,
            assignmentId
          }
        });
        
        return;
      }

      if (result.data) {
        // Log successful payment submission
        securityLogger.log({
          level: SecurityLogLevel.INFO,
          event: SecurityEventType.DATA_MODIFICATION,
          userId: user?.id,
          userRole: profile?.role,
          success: true,
          details: { 
            action: existingPayment ? 'payment_updated' : 'payment_recorded',
            paymentId: result.data.id,
            assignmentId,
            paymentStatus: result.data.payment_status,
            amountPaid: result.data.amount_paid
          }
        });

        // Check if photo upload failed but payment succeeded
        if (data.evidence_photo?.[0] && !result.data.evidence_photo_url) {
          toast('⚠️ Pago registrado correctamente, pero no se pudo subir la foto de evidencia. Contacta al administrador para configurar el almacenamiento.', {
            duration: 6000,
            style: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' }
          });
        }
        onSuccess(result.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      // Log unexpected error
      securityLogger.log({
        level: SecurityLogLevel.ERROR,
        event: SecurityEventType.DATA_MODIFICATION,
        userId: user?.id,
        userRole: profile?.role,
        success: false,
        details: { 
          action: 'payment_submission_error',
          error: errorMessage,
          assignmentId
        }
      });
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
        {/* Installment Information Banner */}
        {loadingInstallment ? (
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <LoadingSpinner size="sm" className="me-2" />
            <span>Cargando información de la cuota...</span>
          </div>
        ) : installmentInfo ? (
          <div className="alert alert-primary" role="alert">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-calendar-check fs-4 me-3"></i>
              <div className="flex-grow-1">
                <div className="fw-bold">
                  Cuota {installmentInfo.installment_number} de {installmentInfo.total_installments}
                </div>
                <small className="text-muted">
                  Fecha de vencimiento: {new Date(installmentInfo.due_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </small>
              </div>
              <div className="text-end">
                <div className="fs-5 fw-bold text-primary">
                  ${installmentInfo.amount.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <div 
                className="progress-bar bg-success" 
                role="progressbar" 
                style={{ 
                  width: `${(installmentInfo.installment_number / installmentInfo.total_installments) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        ) : paymentScheduleId ? (
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            No se pudo cargar la información de la cuota
          </div>
        ) : (
          <div className="alert alert-info" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            Este cliente no tiene una cuota pendiente asignada en esta ruta
          </div>
        )}

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
              accept="image/jpeg,image/jpg,image/png,image/webp"
              capture="environment"
              {...register('evidence_photo', {
                required: paymentStatus !== 'paid' && !previewImage ? 'La foto de evidencia es requerida' : false,
                validate: {
                  fileType: (files: FileList | undefined) => {
                    if (!files || files.length === 0) return true;
                    const file = files[0];
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                    return allowedTypes.includes(file.type) || 'Solo se permiten imágenes (JPEG, PNG, WebP)';
                  },
                  fileSize: (files: FileList | undefined) => {
                    if (!files || files.length === 0) return true;
                    const file = files[0];
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    return file.size <= maxSize || `El archivo no puede ser mayor a 5MB (actual: ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
                  }
                }
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
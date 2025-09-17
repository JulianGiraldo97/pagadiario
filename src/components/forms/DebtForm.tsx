'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CreateDebtForm, DebtFrequency, Client } from '@/lib/types';
import { generatePaymentSchedule } from '@/lib/supabase/debts';

interface DebtFormProps {
  clients: Client[];
  onSubmit: (data: CreateDebtForm) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface DebtFormData extends CreateDebtForm {
  // Additional fields for form calculations
}

export default function DebtForm({ clients, onSubmit, onCancel, isLoading = false }: DebtFormProps) {
  const [previewSchedule, setPreviewSchedule] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    reset
  } = useForm<DebtFormData>();

  // Watch form values for real-time calculations
  const watchedValues = watch();
  const { total_amount, installment_amount, frequency, start_date } = watchedValues;

  // Calculate and preview payment schedule
  const handlePreviewSchedule = () => {
    if (total_amount && installment_amount && frequency && start_date) {
      const schedule = generatePaymentSchedule(
        parseFloat(total_amount.toString()),
        parseFloat(installment_amount.toString()),
        frequency,
        start_date
      );
      setPreviewSchedule(schedule);
      setShowPreview(true);
    }
  };

  // Calculate suggested installment based on frequency
  const calculateSuggestedInstallment = (frequency: DebtFrequency, totalAmount: number) => {
    if (!totalAmount || totalAmount <= 0) return 0;
    
    // Suggest installments that would complete in reasonable time
    const suggestedDays = frequency === 'daily' ? 30 : 12; // 30 days or 12 weeks
    return Math.ceil(totalAmount / suggestedDays);
  };

  const handleFrequencyChange = (newFrequency: DebtFrequency) => {
    if (total_amount) {
      const suggested = calculateSuggestedInstallment(newFrequency, parseFloat(total_amount.toString()));
      setValue('installment_amount', suggested);
    }
  };

  const onFormSubmit = async (data: DebtFormData) => {
    try {
      await onSubmit(data);
      reset();
      setPreviewSchedule([]);
      setShowPreview(false);
    } catch (error) {
      console.error('Error submitting debt form:', error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Asignar Nueva Deuda</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="row">
            {/* Client Selection */}
            <div className="col-md-6 mb-3">
              <label htmlFor="client_id" className="form-label">
                Cliente <span className="text-danger">*</span>
              </label>
              <select
                id="client_id"
                className={`form-select ${errors.client_id ? 'is-invalid' : ''}`}
                {...register('client_id', { required: 'Seleccione un cliente' })}
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.address}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <div className="invalid-feedback">{errors.client_id.message}</div>
              )}
            </div>

            {/* Total Amount */}
            <div className="col-md-6 mb-3">
              <label htmlFor="total_amount" className="form-label">
                Monto Total <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  id="total_amount"
                  className={`form-control ${errors.total_amount ? 'is-invalid' : ''}`}
                  step="0.01"
                  min="0.01"
                  {...register('total_amount', {
                    required: 'El monto total es requerido',
                    min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
                    valueAsNumber: true
                  })}
                />
                {errors.total_amount && (
                  <div className="invalid-feedback">{errors.total_amount.message}</div>
                )}
              </div>
            </div>

            {/* Frequency */}
            <div className="col-md-6 mb-3">
              <label htmlFor="frequency" className="form-label">
                Frecuencia de Pago <span className="text-danger">*</span>
              </label>
              <select
                id="frequency"
                className={`form-select ${errors.frequency ? 'is-invalid' : ''}`}
                {...register('frequency', { required: 'Seleccione la frecuencia' })}
                onChange={(e) => handleFrequencyChange(e.target.value as DebtFrequency)}
              >
                <option value="">Seleccionar frecuencia...</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
              </select>
              {errors.frequency && (
                <div className="invalid-feedback">{errors.frequency.message}</div>
              )}
            </div>

            {/* Installment Amount */}
            <div className="col-md-6 mb-3">
              <label htmlFor="installment_amount" className="form-label">
                Monto por Cuota <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  id="installment_amount"
                  className={`form-control ${errors.installment_amount ? 'is-invalid' : ''}`}
                  step="0.01"
                  min="0.01"
                  {...register('installment_amount', {
                    required: 'El monto por cuota es requerido',
                    min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
                    validate: (value) => {
                      if (total_amount && value > total_amount) {
                        return 'La cuota no puede ser mayor al monto total';
                      }
                      return true;
                    },
                    valueAsNumber: true
                  })}
                />
                {errors.installment_amount && (
                  <div className="invalid-feedback">{errors.installment_amount.message}</div>
                )}
              </div>
              {frequency && total_amount && (
                <div className="form-text">
                  Sugerido: ${calculateSuggestedInstallment(frequency, parseFloat(total_amount.toString()))}
                  {frequency === 'daily' ? ' (30 días)' : ' (12 semanas)'}
                </div>
              )}
            </div>

            {/* Start Date */}
            <div className="col-md-6 mb-3">
              <label htmlFor="start_date" className="form-label">
                Fecha de Inicio <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                {...register('start_date', { required: 'La fecha de inicio es requerida' })}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.start_date && (
                <div className="invalid-feedback">{errors.start_date.message}</div>
              )}
            </div>

            {/* Preview Button */}
            <div className="col-md-6 mb-3 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-info"
                onClick={handlePreviewSchedule}
                disabled={!total_amount || !installment_amount || !frequency || !start_date}
              >
                <i className="bi bi-eye me-2"></i>
                Previsualizar Cronograma
              </button>
            </div>
          </div>

          {/* Payment Schedule Preview */}
          {showPreview && previewSchedule.length > 0 && (
            <div className="mt-4">
              <h6>Cronograma de Pagos (Previsualización)</h6>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-sm table-striped">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th>Cuota #</th>
                      <th>Fecha Vencimiento</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSchedule.map((item, index) => (
                      <tr key={index}>
                        <td>{item.installment_number}</td>
                        <td>{new Date(item.due_date).toLocaleDateString('es-ES')}</td>
                        <td>${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="alert alert-info mt-2">
                <small>
                  <strong>Total de cuotas:</strong> {previewSchedule.length} | 
                  <strong> Monto total:</strong> ${previewSchedule.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                </small>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creando...
                </>
              ) : (
                'Crear Deuda'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
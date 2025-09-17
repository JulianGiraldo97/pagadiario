'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import type { Client, CreateClientForm } from '@/lib/types';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientForm) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateClientForm>({
    defaultValues: {
      name: client?.name || '',
      address: client?.address || '',
      phone: client?.phone || ''
    }
  });

  const [submitError, setSubmitError] = useState<string>('');

  const handleFormSubmit = async (data: CreateClientForm) => {
    try {
      setSubmitError('');
      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error al guardar el cliente');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="needs-validation" noValidate>
      {submitError && (
        <div className="alert alert-danger" role="alert">
          {submitError}
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="name" className="form-label">
          Nombre completo <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          id="name"
          {...register('name', {
            required: 'El nombre es requerido',
            minLength: {
              value: 2,
              message: 'El nombre debe tener al menos 2 caracteres'
            },
            maxLength: {
              value: 100,
              message: 'El nombre no puede exceder 100 caracteres'
            }
          })}
          disabled={isSubmitting || isLoading}
        />
        {errors.name && (
          <div className="invalid-feedback">
            {errors.name.message}
          </div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="address" className="form-label">
          Dirección <span className="text-danger">*</span>
        </label>
        <textarea
          className={`form-control ${errors.address ? 'is-invalid' : ''}`}
          id="address"
          rows={3}
          {...register('address', {
            required: 'La dirección es requerida',
            minLength: {
              value: 5,
              message: 'La dirección debe tener al menos 5 caracteres'
            },
            maxLength: {
              value: 255,
              message: 'La dirección no puede exceder 255 caracteres'
            }
          })}
          disabled={isSubmitting || isLoading}
        />
        {errors.address && (
          <div className="invalid-feedback">
            {errors.address.message}
          </div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="phone" className="form-label">
          Teléfono
        </label>
        <input
          type="tel"
          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
          id="phone"
          {...register('phone', {
            pattern: {
              value: /^[\d\s\-\+\(\)]+$/,
              message: 'Formato de teléfono inválido'
            },
            maxLength: {
              value: 20,
              message: 'El teléfono no puede exceder 20 caracteres'
            }
          })}
          disabled={isSubmitting || isLoading}
        />
        {errors.phone && (
          <div className="invalid-feedback">
            {errors.phone.message}
          </div>
        )}
        <div className="form-text">
          Opcional. Ejemplo: +57 300 123 4567
        </div>
      </div>

      <div className="d-flex gap-2 justify-content-end">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {client ? 'Actualizando...' : 'Guardando...'}
            </>
          ) : (
            client ? 'Actualizar Cliente' : 'Crear Cliente'
          )}
        </button>
      </div>
    </form>
  );
}
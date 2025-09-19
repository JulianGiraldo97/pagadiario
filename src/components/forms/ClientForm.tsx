'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Client, CreateClientForm } from '@/lib/types';
import { 
  validateClientForm, 
  sanitizeName, 
  sanitizeAddress, 
  sanitizePhone,
  securityLogger,
  SecurityLogLevel,
  SecurityEventType
} from '@/lib/utils/security';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientForm) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const { user, profile } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
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
      
      // Log form submission attempt
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.DATA_MODIFICATION,
        userId: user?.id,
        userRole: profile?.role,
        details: { 
          action: client ? 'update_client' : 'create_client',
          clientId: client?.id
        }
      });

      // Validate and sanitize input data
      const validation = validateClientForm(data);
      if (!validation.isValid) {
        // Set form errors
        Object.entries(validation.errors).forEach(([field, message]) => {
          setError(field as keyof CreateClientForm, { message });
        });
        
        // Log validation failure
        securityLogger.log({
          level: SecurityLogLevel.WARNING,
          event: SecurityEventType.INVALID_INPUT,
          userId: user?.id,
          userRole: profile?.role,
          details: { 
            action: 'client_form_validation_failed',
            errors: validation.errors
          }
        });
        
        return;
      }

      // Sanitize data before submission
      const sanitizedData: CreateClientForm = {
        name: sanitizeName(data.name),
        address: sanitizeAddress(data.address),
        phone: data.phone ? sanitizePhone(data.phone) : undefined
      };

      await onSubmit(sanitizedData);
      
      // Log successful submission
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.DATA_MODIFICATION,
        userId: user?.id,
        userRole: profile?.role,
        success: true,
        details: { 
          action: client ? 'client_updated' : 'client_created',
          clientId: client?.id
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el cliente';
      setSubmitError(errorMessage);
      
      // Log submission error
      securityLogger.log({
        level: SecurityLogLevel.ERROR,
        event: SecurityEventType.DATA_MODIFICATION,
        userId: user?.id,
        userRole: profile?.role,
        success: false,
        details: { 
          action: client ? 'update_client_error' : 'create_client_error',
          error: errorMessage,
          clientId: client?.id
        }
      });
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
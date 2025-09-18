'use client';

import { useState } from 'react';
import { createCollector, updateCollector, type CreateCollectorForm, type UpdateCollectorForm } from '@/lib/supabase/collectors';
import type { Profile } from '@/lib/types';

interface CollectorFormProps {
  collector?: Profile;
  onSuccess: (collector: Profile) => void;
  onCancel: () => void;
}

export default function CollectorForm({ collector, onSuccess, onCancel }: CollectorFormProps) {
  const [formData, setFormData] = useState({
    email: collector?.email || '',
    full_name: collector?.full_name || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!collector;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.full_name.trim()) {
        setError('El nombre completo es requerido');
        return;
      }

      if (!formData.email.trim()) {
        setError('El email es requerido');
        return;
      }

      if (!isEditing) {
        if (!formData.password) {
          setError('La contraseña es requerida');
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          return;
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('El email no tiene un formato válido');
        return;
      }

      let result;
      
      if (isEditing) {
        const updateData: UpdateCollectorForm = {
          email: formData.email,
          full_name: formData.full_name
        };
        result = await updateCollector(collector.id, updateData);
      } else {
        const createData: CreateCollectorForm = {
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password
        };
        result = await createCollector(createData);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-12">
          <label htmlFor="full_name" className="form-label">
            Nombre Completo *
          </label>
          <input
            type="text"
            className="form-control"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="col-12">
          <label htmlFor="email" className="form-label">
            Email *
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        {!isEditing && (
          <>
            <div className="col-12">
              <div className="alert alert-info" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Nota:</strong> El cobrador será creado en el sistema pero necesitará configurar su acceso de autenticación por separado.
              </div>
            </div>
            
            <div className="col-md-6">
              <label htmlFor="password" className="form-label">
                Contraseña *
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                disabled={loading}
              />
              <div className="form-text">
                Mínimo 6 caracteres (solo para referencia)
              </div>
            </div>

            <div className="col-md-6">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </>
        )}

        {error && (
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </div>
        )}

        <div className="col-12">
          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                isEditing ? 'Actualizar Cobrador' : 'Crear Cobrador'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
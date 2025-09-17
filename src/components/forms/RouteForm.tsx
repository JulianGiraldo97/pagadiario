'use client';

import { useForm, Controller } from 'react-hook-form';
import { useState, useEffect } from 'react';
import type { Profile, Client, CreateRouteForm, ClientWithDebt } from '@/lib/types';

interface RouteFormProps {
  collectors: Profile[];
  clients: ClientWithDebt[];
  onSubmit: (data: CreateRouteForm) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RouteForm({ 
  collectors, 
  clients, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: RouteFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreateRouteForm>({
    defaultValues: {
      collector_id: '',
      route_date: new Date().toISOString().split('T')[0],
      client_ids: []
    }
  });

  const [submitError, setSubmitError] = useState<string>('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const watchedCollectorId = watch('collector_id');
  const watchedRouteDate = watch('route_date');

  // Filter clients based on search term and those with active debts
  const filteredClients = clients.filter(client => {
    const hasActiveDebt = client.total_active_debt && client.total_active_debt > 0;
    const matchesSearch = !searchTerm || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return hasActiveDebt && matchesSearch;
  });

  const handleFormSubmit = async (data: CreateRouteForm) => {
    try {
      setSubmitError('');
      
      if (selectedClients.length === 0) {
        setSubmitError('Debe seleccionar al menos un cliente para la ruta');
        return;
      }

      await onSubmit({
        ...data,
        client_ids: selectedClients
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error al crear la ruta');
    }
  };

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const handleClientReorder = (clientId: string, direction: 'up' | 'down') => {
    setSelectedClients(prev => {
      const currentIndex = prev.indexOf(clientId);
      if (currentIndex === -1) return prev;

      const newArray = [...prev];
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < newArray.length) {
        [newArray[currentIndex], newArray[newIndex]] = [newArray[newIndex], newArray[currentIndex]];
      }

      return newArray;
    });
  };

  const getSelectedClientData = (clientId: string) => {
    return clients.find(client => client.id === clientId);
  };

  // Update form value when selectedClients changes
  useEffect(() => {
    setValue('client_ids', selectedClients);
  }, [selectedClients, setValue]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="needs-validation" noValidate>
      {submitError && (
        <div className="alert alert-danger" role="alert">
          {submitError}
        </div>
      )}

      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="collector_id" className="form-label">
              Cobrador <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.collector_id ? 'is-invalid' : ''}`}
              id="collector_id"
              {...register('collector_id', {
                required: 'Debe seleccionar un cobrador'
              })}
              disabled={isSubmitting || isLoading}
            >
              <option value="">Seleccionar cobrador...</option>
              {collectors.map((collector) => (
                <option key={collector.id} value={collector.id}>
                  {collector.full_name}
                </option>
              ))}
            </select>
            {errors.collector_id && (
              <div className="invalid-feedback">
                {errors.collector_id.message}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="route_date" className="form-label">
              Fecha de la ruta <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className={`form-control ${errors.route_date ? 'is-invalid' : ''}`}
              id="route_date"
              {...register('route_date', {
                required: 'La fecha es requerida',
                validate: (value) => {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (selectedDate < today) {
                    return 'No se pueden crear rutas para fechas pasadas';
                  }
                  return true;
                }
              })}
              disabled={isSubmitting || isLoading}
            />
            {errors.route_date && (
              <div className="invalid-feedback">
                {errors.route_date.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">Clientes Disponibles</h6>
              <div className="mt-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredClients.length === 0 ? (
                <p className="text-muted text-center">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes con deudas activas'}
                </p>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`list-group-item list-group-item-action ${
                        selectedClients.includes(client.id) ? 'active' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleClientToggle(client.id)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{client.name}</h6>
                          <p className="mb-1 small">{client.address}</p>
                          <small>
                            Deuda activa: ${client.total_active_debt?.toLocaleString() || 0}
                          </small>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedClients.includes(client.id)}
                            onChange={() => handleClientToggle(client.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">
                Ruta Asignada ({selectedClients.length} clientes)
              </h6>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {selectedClients.length === 0 ? (
                <p className="text-muted text-center">
                  Seleccione clientes de la lista para crear la ruta
                </p>
              ) : (
                <div className="list-group list-group-flush">
                  {selectedClients.map((clientId, index) => {
                    const client = getSelectedClientData(clientId);
                    if (!client) return null;

                    return (
                      <div key={clientId} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <span className="badge bg-primary me-2">{index + 1}</span>
                              <h6 className="mb-0">{client.name}</h6>
                            </div>
                            <p className="mb-1 small text-muted">{client.address}</p>
                            <small className="text-success">
                              ${client.total_active_debt?.toLocaleString() || 0}
                            </small>
                          </div>
                          <div className="btn-group-vertical btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => handleClientReorder(clientId, 'up')}
                              disabled={index === 0}
                              title="Mover arriba"
                            >
                              <i className="bi bi-arrow-up"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => handleClientReorder(clientId, 'down')}
                              disabled={index === selectedClients.length - 1}
                              title="Mover abajo"
                            >
                              <i className="bi bi-arrow-down"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleClientToggle(clientId)}
                              title="Remover de la ruta"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 justify-content-end mt-4">
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
          disabled={isSubmitting || isLoading || selectedClients.length === 0}
        >
          {isSubmitting || isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creando ruta...
            </>
          ) : (
            'Crear Ruta'
          )}
        </button>
      </div>
    </form>
  );
}
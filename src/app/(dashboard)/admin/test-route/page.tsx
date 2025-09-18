'use client';

import { useState } from 'react';
import { createRoute } from '@/lib/supabase/routes';
import { getAllCollectors } from '@/lib/supabase/collectors';
import { getClients } from '@/lib/supabase/clients';
import { useEffect } from 'react';
import type { Profile, Client } from '@/lib/types';

export default function TestRoutePage() {
  const [collectors, setCollectors] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedCollector, setSelectedCollector] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [collectorsResult, clientsResult] = await Promise.all([
        getAllCollectors(),
        getClients()
      ]);

      if (collectorsResult.error) {
        setMessage({ type: 'error', text: collectorsResult.error });
        return;
      }

      if (clientsResult.error) {
        setMessage({ type: 'error', text: clientsResult.error });
        return;
      }

      setCollectors(collectorsResult.data || []);
      setClients(clientsResult.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error cargando datos' });
    }
  };

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleCreateRoute = async () => {
    if (!selectedCollector || selectedClients.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona un cobrador y al menos un cliente' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await createRoute({
        collector_id: selectedCollector,
        route_date: routeDate,
        client_ids: selectedClients
      });

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Ruta creada exitosamente' });
        setSelectedClients([]);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creando la ruta' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Crear Ruta de Prueba</h2>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
          {message.text}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setMessage(null)}
          ></button>
        </div>
      )}

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Configuración de Ruta</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="routeDate" className="form-label">Fecha de la Ruta</label>
                <input
                  type="date"
                  className="form-control"
                  id="routeDate"
                  value={routeDate}
                  onChange={(e) => setRouteDate(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="collector" className="form-label">Cobrador</label>
                <select
                  className="form-select"
                  id="collector"
                  value={selectedCollector}
                  onChange={(e) => setSelectedCollector(e.target.value)}
                >
                  <option value="">Selecciona un cobrador</option>
                  {collectors.map(collector => (
                    <option key={collector.id} value={collector.id}>
                      {collector.full_name} ({collector.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Clientes Seleccionados ({selectedClients.length})
                </label>
                <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {clients.map(client => (
                    <div key={client.id} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`client-${client.id}`}
                        checked={selectedClients.includes(client.id)}
                        onChange={() => handleClientToggle(client.id)}
                      />
                      <label className="form-check-label" htmlFor={`client-${client.id}`}>
                        {client.name} - {client.address}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCreateRoute}
                disabled={loading || !selectedCollector || selectedClients.length === 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle me-2"></i>
                    Crear Ruta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Instrucciones</h5>
            </div>
            <div className="card-body">
              <h6>Cómo probar el registro de pagos:</h6>
              <ol>
                <li>Selecciona un cobrador de la lista</li>
                <li>Selecciona uno o más clientes</li>
                <li>Elige la fecha (hoy por defecto)</li>
                <li>Haz clic en &quot;Crear Ruta&quot;</li>
                <li>Ve al dashboard del cobrador</li>
                <li>Verás los clientes asignados con botones &quot;Registrar Pago&quot;</li>
                <li>Haz clic en &quot;Registrar Pago&quot; para abrir el formulario</li>
                <li>Completa el formulario con el estado del pago</li>
                <li>Toma una foto como evidencia si es necesario</li>
                <li>Guarda el registro</li>
              </ol>

              <div className="alert alert-info mt-3">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Nota:</strong> Esta página es solo para pruebas. En producción, las rutas se crearían desde la página de administración de rutas.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
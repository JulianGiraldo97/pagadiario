'use client';

import { useState, useEffect } from 'react';
import { getAllCollectors } from '@/lib/supabase/collectors';
import CollectorForm from '@/components/forms/CollectorForm';
import CollectorTable from '@/components/tables/CollectorTable';
import type { Profile } from '@/lib/types';

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCollector, setEditingCollector] = useState<Profile | null>(null);

  // Load collectors
  const loadCollectors = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAllCollectors();
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setCollectors(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollectors();
  }, []);

  const handleCreateCollector = () => {
    setEditingCollector(null);
    setShowForm(true);
  };

  const handleEditCollector = (collector: Profile) => {
    setEditingCollector(collector);
    setShowForm(true);
  };

  const handleFormSuccess = (collector: Profile) => {
    if (editingCollector) {
      // Update existing collector
      setCollectors(prev => 
        prev.map(c => c.id === collector.id ? collector : c)
      );
    } else {
      // Add new collector
      setCollectors(prev => [...prev, collector]);
    }
    
    setShowForm(false);
    setEditingCollector(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCollector(null);
  };

  const handleDeleteCollector = (collectorId: string) => {
    setCollectors(prev => prev.filter(c => c.id !== collectorId));
  };

  const refreshCollectors = () => {
    loadCollectors();
  };

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={refreshCollectors}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Gestión de Cobradores</h2>
          <p className="text-muted mb-0">
            Administra los cobradores del sistema
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCreateCollector}
          disabled={showForm}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Nuevo Cobrador
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <i className="bi bi-people display-6 text-primary mb-2"></i>
              <h4 className="mb-1">{collectors.length}</h4>
              <small className="text-muted">Total Cobradores</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <i className="bi bi-person-check display-6 text-success mb-2"></i>
              <h4 className="mb-1">{collectors.length}</h4>
              <small className="text-muted">Activos</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <i className="bi bi-calendar-check display-6 text-info mb-2"></i>
              <h4 className="mb-1">0</h4>
              <small className="text-muted">En Ruta Hoy</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <i className="bi bi-graph-up display-6 text-warning mb-2"></i>
              <h4 className="mb-1">0%</h4>
              <small className="text-muted">Eficiencia Promedio</small>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              {editingCollector ? 'Editar Cobrador' : 'Nuevo Cobrador'}
            </h5>
          </div>
          <div className="card-body">
            <CollectorForm
              collector={editingCollector || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Collectors Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-table me-2"></i>
            Lista de Cobradores
          </h5>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={refreshCollectors}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Actualizar
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <CollectorTable
            collectors={collectors}
            onEdit={handleEditCollector}
            onDelete={handleDeleteCollector}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
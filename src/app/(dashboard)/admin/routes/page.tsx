'use client';

import { useState, useEffect } from 'react';
import RouteForm from '@/components/forms/RouteForm';
import RouteTable from '@/components/tables/RouteTable';
import RouteDetailsModal from '@/components/ui/RouteDetailsModal';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { 
  getAllRoutes, 
  getAllCollectors, 
  getClientsWithActiveDebts, 
  createRoute, 
  deleteRoute 
} from '@/lib/supabase/routes';
import type { 
  RouteWithAssignments, 
  Profile, 
  ClientWithDebt, 
  CreateRouteForm 
} from '@/lib/types';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteWithAssignments[]>([]);
  const [collectors, setCollectors] = useState<Profile[]>([]);
  const [clients, setClients] = useState<ClientWithDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithAssignments | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [routesResult, collectorsResult, clientsResult] = await Promise.all([
        getAllRoutes(),
        getAllCollectors(),
        getClientsWithActiveDebts()
      ]);
      
      if (routesResult.error) {
        console.error('Error loading routes:', routesResult.error);
      } else {
        setRoutes(routesResult.data);
      }
      
      if (collectorsResult.error) {
        console.error('Error loading collectors:', collectorsResult.error);
      } else {
        setCollectors(collectorsResult.data);
      }
      
      if (clientsResult.error) {
        console.error('Error loading clients:', clientsResult.error);
      } else {
        setClients(clientsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoute = async (data: CreateRouteForm) => {
    setIsSubmitting(true);
    try {
      const result = await createRoute(data);
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.data) {
        await loadData(); // Reload to get updated data with relations
        setShowCreateModal(false);
      }
    } catch (error) {
      throw error; // Let the form handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewRoute = (route: RouteWithAssignments) => {
    setSelectedRoute(route);
    setShowDetailsModal(true);
  };

  const handleDeleteRoute = (route: RouteWithAssignments) => {
    setSelectedRoute(route);
    setShowDeleteModal(true);
  };

  const confirmDeleteRoute = async () => {
    if (!selectedRoute) return;

    setIsSubmitting(true);
    try {
      const result = await deleteRoute(selectedRoute.id);
      if (result.error) {
        alert(result.error);
      } else if (result.success) {
        await loadData();
        setShowDeleteModal(false);
        setSelectedRoute(null);
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la ruta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Gestión de Rutas</h2>
          <p className="text-muted mb-0">
            Asigna rutas diarias a los cobradores y gestiona las visitas programadas
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          disabled={isLoading}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Crear Ruta
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="fs-4 fw-bold text-primary">
                {routes.filter(r => r.status === 'pending').length}
              </div>
              <small className="text-muted">Rutas Pendientes</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="fs-4 fw-bold text-info">
                {routes.filter(r => r.status === 'in_progress').length}
              </div>
              <small className="text-muted">En Progreso</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="fs-4 fw-bold text-success">
                {routes.filter(r => r.status === 'completed').length}
              </div>
              <small className="text-muted">Completadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="fs-4 fw-bold text-warning">
                {collectors.length}
              </div>
              <small className="text-muted">Cobradores Activos</small>
            </div>
          </div>
        </div>
      </div>
      
      <RouteTable
        routes={routes}
        onView={handleViewRoute}
        onDelete={handleDeleteRoute}
        isLoading={isLoading}
      />

      {/* Create Route Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Ruta"
        size="xl"
      >
        <RouteForm
          collectors={collectors}
          clients={clients}
          onSubmit={handleCreateRoute}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Route Details Modal */}
      <RouteDetailsModal
        route={selectedRoute}
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedRoute(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar Ruta"
        message={
          selectedRoute 
            ? `¿Está seguro que desea eliminar la ruta del ${formatDate(selectedRoute.route_date)} asignada a ${selectedRoute.collector?.full_name}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmDeleteRoute}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedRoute(null);
        }}
        isLoading={isSubmitting}
      />
    </div>
  );
}
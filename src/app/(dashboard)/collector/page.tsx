'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCollectorDailyRoute, getCollectorRouteProgress } from '@/lib/supabase/routes';
import { useIsMobile } from '@/hooks/useIsMobile';
import ClientCard from '@/components/ui/ClientCard';
import RouteProgress from '@/components/ui/RouteProgress';
import RouteNavigation from '@/components/ui/RouteNavigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { RouteAssignmentWithDetails } from '@/lib/types';

export default function CollectorDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  
  const [assignments, setAssignments] = useState<RouteAssignmentWithDetails[]>([]);
  const [progress, setProgress] = useState({
    total: 0,
    visited: 0,
    paid: 0,
    notPaid: 0,
    absent: 0,
    totalCollected: 0,
    totalExpected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentClientIndex, setCurrentClientIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load route data
  const loadRouteData = async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const [routeResult, progressResult] = await Promise.all([
        getCollectorDailyRoute(date),
        getCollectorRouteProgress(date)
      ]);

      if (routeResult.error) {
        setError(routeResult.error);
        return;
      }

      if (progressResult.error) {
        setError(progressResult.error);
        return;
      }

      setAssignments(routeResult.data);
      setProgress(progressResult.data);
      setCurrentClientIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouteData(selectedDate);
    
    // Check for success message from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const message = urlParams.get('message');
    
    if (success === 'true' && message) {
      setSuccessMessage(message);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-hide message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [selectedDate]);

  const handlePaymentClick = (assignment: RouteAssignmentWithDetails) => {
    // Navigate to payment registration page with assignment data
    const params = new URLSearchParams({
      assignmentId: assignment.id,
      clientId: assignment.client_id,
      clientName: assignment.client?.name || '',
      paymentScheduleId: assignment.payment_schedule_id || '',
      date: selectedDate // Include the selected date
    });
    
    router.push(`/collector/payments?${params.toString()}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const refreshData = () => {
    loadRouteData(selectedDate);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={refreshData}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Reintentar
        </button>
      </div>
    );
  }

  // Success message component
  const SuccessAlert = () => {
    if (!successMessage) return null;
    
    return (
      <div className="alert alert-success alert-dismissible fade show" role="alert">
        <i className="bi bi-check-circle me-2"></i>
        {successMessage}
        <button
          type="button"
          className="btn-close"
          onClick={() => setSuccessMessage(null)}
        ></button>
      </div>
    );
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="pb-5">
        <SuccessAlert />
        
        {/* Header with date selector */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Mi Ruta</h4>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ width: 'auto' }}
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x display-1 text-muted mb-3"></i>
            <h5 className="text-muted">No hay ruta asignada</h5>
            <p className="text-muted">No tienes clientes asignados para la fecha {selectedDate}.</p>
            <small className="text-muted">
              Contacta al administrador para que te asigne una ruta para esta fecha.
            </small>
          </div>
        ) : (
          <>
            {/* Compact progress */}
            <div className="mb-3">
              <RouteProgress {...progress} isCompact={true} />
            </div>

            {/* Navigation */}
            <RouteNavigation
              assignments={assignments}
              currentIndex={currentClientIndex}
              onNavigate={setCurrentClientIndex}
              isMobile={true}
            />

            {/* Current client card */}
            <div className="mt-3">
              <ClientCard
                assignment={assignments[currentClientIndex]}
                onPaymentClick={handlePaymentClick}
                isOptimizedForMobile={true}
              />
            </div>

            {/* Quick actions */}
            <div className="fixed-bottom bg-white border-top p-3">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary flex-grow-1"
                  onClick={() => handlePaymentClick(assignments[currentClientIndex])}
                  disabled={!!assignments[currentClientIndex]?.payment}
                >
                  <i className="bi bi-cash me-1"></i>
                  Registrar Pago
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={refreshData}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div>
      <SuccessAlert />
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Mi Ruta del Día</h2>
        <div className="d-flex gap-2 align-items-center">
          <label htmlFor="dateSelector" className="form-label mb-0 me-2">Fecha:</label>
          <input
            id="dateSelector"
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedDate}
            onChange={handleDateChange}
          />
          <button className="btn btn-outline-secondary" onClick={refreshData}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-calendar-x display-1 text-muted mb-3"></i>
          <h4 className="text-muted">No hay ruta asignada</h4>
          <p className="text-muted">No tienes clientes asignados para la fecha {selectedDate}.</p>
          <small className="text-muted">
            Contacta al administrador para que te asigne una ruta para esta fecha.
          </small>
        </div>
      ) : (
        <>
          {/* Progress overview */}
          <div className="mb-4">
            <RouteProgress {...progress} />
          </div>

          <div className="row g-4">
            {/* Client list */}
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-people me-2"></i>
                    Clientes Asignados ({assignments.length})
                  </h5>
                  <div className="btn-group btn-group-sm" role="group">
                    <input type="radio" className="btn-check" name="viewMode" id="listView" defaultChecked />
                    <label className="btn btn-outline-secondary" htmlFor="listView">
                      <i className="bi bi-list"></i>
                    </label>
                    <input type="radio" className="btn-check" name="viewMode" id="cardView" />
                    <label className="btn btn-outline-secondary" htmlFor="cardView">
                      <i className="bi bi-grid"></i>
                    </label>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {assignments.map((assignment, index) => (
                      <div key={assignment.id} className="col-12">
                        <ClientCard
                          assignment={assignment}
                          onPaymentClick={handlePaymentClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with summary */}
            <div className="col-lg-4">
              <div className="card mb-3">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="bi bi-clock me-2"></i>
                    Resumen Rápido
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-2 text-center">
                    <div className="col-6">
                      <div className="p-2 bg-primary bg-opacity-10 rounded">
                        <div className="fw-bold text-primary">{progress.total}</div>
                        <small className="text-muted">Total</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 bg-info bg-opacity-10 rounded">
                        <div className="fw-bold text-info">{progress.visited}</div>
                        <small className="text-muted">Visitados</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 bg-success bg-opacity-10 rounded">
                        <div className="fw-bold text-success">{progress.paid}</div>
                        <small className="text-muted">Pagaron</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 bg-danger bg-opacity-10 rounded">
                        <div className="fw-bold text-danger">{progress.notPaid + progress.absent}</div>
                        <small className="text-muted">Pendientes</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="bi bi-cash-stack me-2"></i>
                    Recaudación
                  </h6>
                </div>
                <div className="card-body">
                  <div className="text-center">
                    <div className="display-6 text-success mb-2">
                      ${progress.totalCollected.toLocaleString()}
                    </div>
                    <div className="text-muted mb-3">
                      de ${progress.totalExpected.toLocaleString()}
                    </div>
                    <div className="progress">
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ 
                          width: `${progress.totalExpected > 0 ? (progress.totalCollected / progress.totalExpected) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
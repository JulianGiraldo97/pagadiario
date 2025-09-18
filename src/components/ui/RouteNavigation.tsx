'use client';

import { useState, useEffect } from 'react';
import type { RouteAssignmentWithDetails } from '@/lib/types';

interface RouteNavigationProps {
  assignments: RouteAssignmentWithDetails[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  isMobile?: boolean;
}

export default function RouteNavigation({ 
  assignments, 
  currentIndex, 
  onNavigate, 
  isMobile = false 
}: RouteNavigationProps) {
  
  const [showQuickNav, setShowQuickNav] = useState(false);
  
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < assignments.length - 1;
  
  const currentClient = assignments[currentIndex]?.client;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrevious) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && canGoNext) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, canGoPrevious, canGoNext, onNavigate]);

  if (assignments.length === 0) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="sticky-top bg-white border-bottom shadow-sm">
        <div className="container-fluid p-3">
          {/* Current client info */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="flex-grow-1">
              <h6 className="mb-0">{currentClient?.name || 'Cliente'}</h6>
              <small className="text-muted">
                Cliente {currentIndex + 1} de {assignments.length}
              </small>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowQuickNav(!showQuickNav)}
            >
              <i className="bi bi-list"></i>
            </button>
          </div>

          {/* Progress bar */}
          <div className="progress mb-3" style={{ height: '4px' }}>
            <div 
              className="progress-bar bg-primary" 
              role="progressbar" 
              style={{ width: `${((currentIndex + 1) / assignments.length) * 100}%` }}
            ></div>
          </div>

          {/* Navigation buttons */}
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary flex-grow-1"
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={!canGoPrevious}
            >
              <i className="bi bi-chevron-left me-1"></i>
              Anterior
            </button>
            <button
              className="btn btn-outline-primary flex-grow-1"
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={!canGoNext}
            >
              Siguiente
              <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>

          {/* Quick navigation dropdown */}
          {showQuickNav && (
            <div className="mt-3 border-top pt-3">
              <div className="row g-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {assignments.map((assignment, index) => {
                  const client = assignment.client;
                  const payment = assignment.payment;
                  const isActive = index === currentIndex;
                  
                  let statusIcon = 'bi-clock text-warning';
                  if (payment) {
                    switch (payment.payment_status) {
                      case 'paid':
                        statusIcon = 'bi-check-circle-fill text-success';
                        break;
                      case 'not_paid':
                        statusIcon = 'bi-x-circle-fill text-danger';
                        break;
                      case 'client_absent':
                        statusIcon = 'bi-person-slash text-secondary';
                        break;
                    }
                  }

                  return (
                    <div key={assignment.id} className="col-12">
                      <button
                        className={`btn w-100 text-start p-2 ${
                          isActive ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                        onClick={() => {
                          onNavigate(index);
                          setShowQuickNav(false);
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <i className={`bi ${statusIcon} me-2`}></i>
                          <div className="flex-grow-1">
                            <div className="fw-bold">{client?.name}</div>
                            <small className="text-muted">#{assignment.visit_order}</small>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop navigation
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-outline-primary"
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={!canGoPrevious}
          >
            <i className="bi bi-chevron-left me-1"></i>
            Anterior
          </button>

          <div className="text-center">
            <div className="fw-bold">{currentClient?.name}</div>
            <small className="text-muted">
              Cliente {currentIndex + 1} de {assignments.length}
            </small>
            <div className="progress mt-2" style={{ width: '200px', height: '4px' }}>
              <div 
                className="progress-bar bg-primary" 
                role="progressbar" 
                style={{ width: `${((currentIndex + 1) / assignments.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={!canGoNext}
          >
            Siguiente
            <i className="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Error Inesperado
                  </h5>
                </div>
                <div className="card-body">
                  <p className="card-text">
                    Ha ocurrido un error inesperado. Por favor, recarga la página o contacta al administrador si el problema persiste.
                  </p>
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.location.reload()}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Recargar Página
                    </button>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => this.setState({ hasError: false })}
                    >
                      Intentar de Nuevo
                    </button>
                  </div>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-3">
                      <summary className="text-muted">Detalles del Error (Desarrollo)</summary>
                      <pre className="mt-2 p-2 bg-light border rounded small">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
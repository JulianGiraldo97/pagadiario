'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="mb-4">
          <i className="bi bi-bug-fill text-danger" style={{ fontSize: '4rem' }}></i>
        </div>
        <h1 className="display-1 fw-bold text-danger">500</h1>
        <h2 className="mb-3">Error del Servidor</h2>
        <p className="lead mb-4 text-muted">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
        </p>
        <div className="d-grid gap-2 d-md-block">
          <button 
            className="btn btn-primary btn-lg"
            onClick={reset}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Intentar de Nuevo
          </button>
          <button 
            className="btn btn-outline-secondary btn-lg ms-md-2"
            onClick={() => window.location.href = '/'}
          >
            <i className="bi bi-house me-2"></i>
            Ir al Inicio
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-start">
            <summary className="btn btn-outline-info btn-sm">
              Ver Detalles del Error (Desarrollo)
            </summary>
            <div className="mt-3 p-3 bg-white border rounded">
              <h6>Error Message:</h6>
              <pre className="text-danger small">{error.message}</pre>
              {error.digest && (
                <>
                  <h6 className="mt-3">Error Digest:</h6>
                  <code className="text-muted">{error.digest}</code>
                </>
              )}
              {error.stack && (
                <>
                  <h6 className="mt-3">Stack Trace:</h6>
                  <pre className="small text-muted" style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {error.stack}
                  </pre>
                </>
              )}
            </div>
          </details>
        )}
        <div className="mt-4">
          <small className="text-muted">
            Error ID: {error.digest || 'N/A'} | Contacta al soporte si el problema persiste.
          </small>
        </div>
      </div>
    </div>
  );
}
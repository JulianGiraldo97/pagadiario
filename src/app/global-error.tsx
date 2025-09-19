'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-danger bg-opacity-10">
          <div className="text-center">
            <div className="mb-4">
              <i className="bi bi-exclamation-octagon-fill text-danger" style={{ fontSize: '5rem' }}></i>
            </div>
            <h1 className="display-1 fw-bold text-danger">Error Crítico</h1>
            <h2 className="mb-3">Algo salió muy mal</h2>
            <p className="lead mb-4 text-muted">
              La aplicación ha encontrado un error crítico y necesita reiniciarse.
            </p>
            <div className="d-grid gap-2 d-md-block">
              <button 
                className="btn btn-danger btn-lg"
                onClick={reset}
              >
                <i className="bi bi-bootstrap-reboot me-2"></i>
                Reiniciar Aplicación
              </button>
              <button 
                className="btn btn-outline-secondary btn-lg ms-md-2"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Recargar Página
              </button>
            </div>
            <div className="mt-4">
              <small className="text-muted">
                Si este error persiste, contacta al administrador del sistema inmediatamente.
              </small>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="mb-4">
          <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '4rem' }}></i>
        </div>
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2 className="mb-3">Página No Encontrada</h2>
        <p className="lead mb-4 text-muted">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="d-grid gap-2 d-md-block">
          <Link href="/" className="btn btn-primary btn-lg">
            <i className="bi bi-house me-2"></i>
            Ir al Inicio
          </Link>
          <button 
            className="btn btn-outline-secondary btn-lg ms-md-2"
            onClick={() => window.history.back()}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver Atrás
          </button>
        </div>
        <div className="mt-4">
          <small className="text-muted">
            Si crees que esto es un error, contacta al administrador del sistema.
          </small>
        </div>
      </div>
    </div>
  );
}
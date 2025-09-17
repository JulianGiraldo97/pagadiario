export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-8 col-md-6 col-lg-4">
            <div className="text-center mb-4">
              <h1 className="h3 text-primary fw-bold">Sistema de Paga Diario</h1>
              <p className="text-muted">Gestión de cobros diarios</p>
            </div>
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
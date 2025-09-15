export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-header text-center">
                <h4 className="mb-0">Sistema de Paga Diario</h4>
              </div>
              <div className="card-body">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
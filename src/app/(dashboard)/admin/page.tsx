// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
  return (
    <div>
      <div className="row">
        <div className="col-12">
          <h2>Dashboard Administrativo</h2>
          <p className="text-muted">Bienvenido al sistema de gestión de cobros</p>
        </div>
      </div>
      
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Clientes</h5>
              <p className="card-text">Gestionar clientes y deudas</p>
              <a href="/admin/clients" className="btn btn-primary">
                Ver Clientes
              </a>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Cobradores</h5>
              <p className="card-text">Gestionar cobradores</p>
              <a href="/admin/collectors" className="btn btn-primary">
                Ver Cobradores
              </a>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Rutas</h5>
              <p className="card-text">Asignar rutas diarias</p>
              <a href="/admin/routes" className="btn btn-primary">
                Ver Rutas
              </a>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Reportes</h5>
              <p className="card-text">Ver reportes y métricas</p>
              <a href="/admin/reports" className="btn btn-primary">
                Ver Reportes
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
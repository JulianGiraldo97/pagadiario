export default function CollectorDashboard() {
  return (
    <div>
      <h2 className="mb-4">Mi Ruta del Día</h2>
      
      <div className="row g-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Clientes Asignados</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">Lista de clientes de la ruta será implementada en tareas posteriores</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Progreso del Día</h5>
            </div>
            <div className="card-body">
              <div className="text-center">
                <h3 className="text-primary">0/0</h3>
                <p className="text-muted">Clientes visitados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
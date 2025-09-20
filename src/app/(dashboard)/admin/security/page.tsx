'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SecurityAudit from '@/components/admin/SecurityAudit'

export default function SecurityPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']} requireExactRole={true}>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="bi bi-shield-check me-2"></i>
            Panel de Seguridad
          </h2>
          <div className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Monitoreo y auditoría del sistema
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12">
            <SecurityAudit maxEntries={500} />
          </div>
        </div>

        <div className="row g-4 mt-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="bi bi-shield-exclamation me-2"></i>
                  Configuración de Seguridad
                </h6>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Rate Limiting</strong>
                      <br />
                      <small className="text-muted">Límite de 100 requests por 15 minutos</small>
                    </div>
                    <span className="badge bg-success">Activo</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Validación de Archivos</strong>
                      <br />
                      <small className="text-muted">Solo imágenes, máximo 5MB</small>
                    </div>
                    <span className="badge bg-success">Activo</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Logging de Seguridad</strong>
                      <br />
                      <small className="text-muted">Registro de eventos críticos</small>
                    </div>
                    <span className="badge bg-success">Activo</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Row Level Security</strong>
                      <br />
                      <small className="text-muted">Políticas de acceso a datos</small>
                    </div>
                    <span className="badge bg-success">Activo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Recomendaciones de Seguridad
                </h6>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <h6 className="alert-heading">
                    <i className="bi bi-lightbulb me-2"></i>
                    Mejores Prácticas
                  </h6>
                  <ul className="mb-0">
                    <li>Revisa regularmente los logs de seguridad</li>
                    <li>Monitorea intentos de acceso no autorizado</li>
                    <li>Verifica que los cobradores solo accedan a sus rutas</li>
                    <li>Valida la integridad de las fotos de evidencia</li>
                    <li>Mantén actualizadas las credenciales de acceso</li>
                  </ul>
                </div>
                
                <div className="alert alert-warning">
                  <h6 className="alert-heading">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Alertas Importantes
                  </h6>
                  <p className="mb-0">
                    Los eventos críticos y errores de seguridad se registran automáticamente. 
                    Revisa esta página regularmente para detectar actividad sospechosa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
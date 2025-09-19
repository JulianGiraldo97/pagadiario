import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DashboardLoading() {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
              <LoadingSpinner size="lg" text="Cargando dashboard..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Cargando aplicación..." />
      </div>
    </div>
  );
}
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AuthLoading() {
  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    </div>
  );
}
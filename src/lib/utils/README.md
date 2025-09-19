# Error Handling and UX System

This document describes the error handling and user experience components implemented in the Sistema de Paga Diario.

## Components Overview

### 1. ErrorBoundary
A React error boundary component that catches JavaScript errors anywhere in the child component tree.

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches and displays React errors gracefully
- Shows different UI in development vs production
- Provides retry and reload options
- Logs errors for monitoring

### 2. Toast Notification System
A context-based toast notification system for user feedback.

**Usage:**
```tsx
import { useToast } from '@/components/ui/Toast';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('Éxito', 'Operación completada correctamente');
  };

  const handleError = () => {
    showError('Error', 'Algo salió mal');
  };
};
```

**Features:**
- Multiple toast types (success, error, warning, info)
- Auto-dismiss with configurable duration
- Manual dismiss with close button
- Stacked toasts with proper positioning

### 3. Loading Components
Various loading states and spinners for better UX.

**LoadingSpinner:**
```tsx
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

<LoadingSpinner size="lg" text="Cargando datos..." />
<LoadingSpinner fullScreen text="Inicializando aplicación..." />
```

**LoadingButton:**
```tsx
import { LoadingButton } from '@/components/ui/LoadingSpinner';

<LoadingButton loading={isSubmitting} variant="primary">
  Guardar
</LoadingButton>
```

**LoadingOverlay:**
```tsx
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';

<LoadingOverlay loading={isLoading} text="Procesando...">
  <YourContent />
</LoadingOverlay>
```

**Skeleton:**
```tsx
import { Skeleton, TableSkeleton } from '@/components/ui/LoadingSpinner';

<Skeleton width="200px" height="20px" />
<TableSkeleton rows={5} columns={4} />
```

### 4. Error Handling Utilities
Utility functions and hooks for consistent error handling.

**ErrorHandler Class:**
```tsx
import { ErrorHandler } from '@/lib/utils/errorHandling';

// Handle Supabase errors
const appError = ErrorHandler.handleSupabaseError(supabaseError);

// Handle network errors
const appError = ErrorHandler.handleNetworkError(networkError);

// Handle validation errors
const appError = ErrorHandler.handleValidationError(validationErrors);
```

**useErrorHandler Hook:**
```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleSupabaseError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('table').select();
      if (error) {
        handleSupabaseError(error, 'carga de datos');
      }
    } catch (err) {
      handleError(err, 'operación de base de datos');
    }
  };
};
```

**useAsyncOperation Hook:**
```tsx
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

const MyComponent = () => {
  const { loading, execute } = useAsyncOperation({
    successMessage: 'Datos guardados correctamente',
    errorContext: 'guardado de datos'
  });

  const saveData = () => {
    execute(async () => {
      return await api.saveData(formData);
    });
  };

  return (
    <LoadingButton loading={loading} onClick={saveData}>
      Guardar
    </LoadingButton>
  );
};
```

### 5. Custom Error Pages
Custom error pages for better user experience.

**Files:**
- `src/app/not-found.tsx` - 404 page
- `src/app/error.tsx` - 500 error page
- `src/app/global-error.tsx` - Global error fallback

**Features:**
- Consistent branding and styling
- Helpful navigation options
- Development vs production error details
- User-friendly error messages

## Error Handling Best Practices

### 1. Use Appropriate Error Types
```tsx
// For Supabase operations
const { handleSupabaseError } = useErrorHandler();
if (error) handleSupabaseError(error, 'operación');

// For network operations
const { handleNetworkError } = useErrorHandler();
catch (err) { handleNetworkError(err, 'conexión'); }

// For form validation
const { handleValidationError } = useErrorHandler();
if (validationErrors) handleValidationError(validationErrors, 'formulario');
```

### 2. Provide Context
Always provide context about what operation failed:
```tsx
handleError(error, 'carga de clientes');
handleError(error, 'guardado de pago');
handleError(error, 'generación de reporte');
```

### 3. Use Loading States
Show loading states for all async operations:
```tsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await submitData();
    showSuccess('Éxito', 'Datos guardados');
  } catch (error) {
    handleError(error, 'envío de formulario');
  } finally {
    setLoading(false);
  }
};
```

### 4. Wrap Components in Error Boundaries
```tsx
// In layout or high-level components
<ErrorBoundary>
  <YourFeatureComponent />
</ErrorBoundary>
```

### 5. Use Retry Logic for Network Operations
```tsx
import { retryWithBackoff } from '@/lib/utils/errorHandling';

const fetchWithRetry = () => {
  return retryWithBackoff(
    () => fetch('/api/data'),
    3, // max retries
    1000 // base delay
  );
};
```

## Integration with Existing Components

The error handling system is integrated throughout the application:

1. **Root Layout**: Wrapped with ErrorBoundary and ToastProvider
2. **Forms**: Use LoadingButton and error handling hooks
3. **Tables**: Use TableSkeleton for loading states
4. **API calls**: Use error handling utilities
5. **Navigation**: Loading pages for route transitions

## Testing

All error handling components include comprehensive tests:
- Unit tests for individual components
- Integration tests for error scenarios
- Mock error conditions for testing boundaries

Run tests with:
```bash
npm test src/components/ui/__tests__/
npm test src/hooks/__tests__/
```
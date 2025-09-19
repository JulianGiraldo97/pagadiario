import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export class ErrorHandler {
  static handleSupabaseError(error: PostgrestError): AppError {
    // Map common Supabase errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      '23505': 'Ya existe un registro con estos datos',
      '23503': 'No se puede eliminar porque está siendo usado por otros registros',
      '42501': 'No tienes permisos para realizar esta acción',
      'PGRST116': 'No se encontraron registros',
      'PGRST301': 'Formato de datos inválido'
    };

    const userMessage = errorMappings[error.code] || error.message || 'Error desconocido';

    return {
      message: userMessage,
      code: error.code,
      details: error.details,
      hint: error.hint
    };
  }

  static handleNetworkError(error: Error): AppError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR'
      };
    }

    if (error.message.includes('timeout')) {
      return {
        message: 'La operación tardó demasiado tiempo. Inténtalo de nuevo.',
        code: 'TIMEOUT_ERROR'
      };
    }

    return {
      message: error.message || 'Error de red desconocido',
      code: 'UNKNOWN_NETWORK_ERROR'
    };
  }

  static handleValidationError(errors: Record<string, string[]>): AppError {
    const firstError = Object.values(errors)[0]?.[0];
    return {
      message: firstError || 'Error de validación',
      code: 'VALIDATION_ERROR',
      details: JSON.stringify(errors)
    };
  }

  static handleGenericError(error: unknown): AppError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'GENERIC_ERROR'
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        code: 'STRING_ERROR'
      };
    }

    return {
      message: 'Error desconocido',
      code: 'UNKNOWN_ERROR'
    };
  }
}

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: unknown) => AppError
) => {
  return async (...args: T): Promise<{ data?: R; error?: AppError }> => {
    try {
      const data = await fn(...args);
      return { data };
    } catch (error) {
      const appError = errorHandler ? errorHandler(error) : ErrorHandler.handleGenericError(error);
      return { error: appError };
    }
  };
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
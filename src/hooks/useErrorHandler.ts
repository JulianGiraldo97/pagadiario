'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { ErrorHandler, AppError } from '@/lib/utils/errorHandling';
import { PostgrestError } from '@supabase/supabase-js';

export const useErrorHandler = () => {
  const { showError, showWarning } = useToast();

  const handleError = useCallback((error: unknown, context?: string) => {
    let appError: AppError;

    // Determine error type and handle accordingly
    if (error && typeof error === 'object' && 'code' in error) {
      // Supabase error
      appError = ErrorHandler.handleSupabaseError(error as PostgrestError);
    } else if (error instanceof Error) {
      // Network or generic error
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        appError = ErrorHandler.handleNetworkError(error);
      } else {
        appError = ErrorHandler.handleGenericError(error);
      }
    } else {
      // Unknown error type
      appError = ErrorHandler.handleGenericError(error);
    }

    // Show appropriate toast based on error severity
    const title = context ? `Error en ${context}` : 'Error';
    
    if (appError.code === 'NETWORK_ERROR' || appError.code === 'TIMEOUT_ERROR') {
      showWarning(title, appError.message);
    } else {
      showError(title, appError.message);
    }

    // Log error for debugging
    console.error('Error handled:', {
      context,
      error: appError,
      originalError: error
    });

    return appError;
  }, [showError, showWarning]);

  const handleSupabaseError = useCallback((error: PostgrestError, context?: string) => {
    return handleError(error, context);
  }, [handleError]);

  const handleNetworkError = useCallback((error: Error, context?: string) => {
    return handleError(error, context);
  }, [handleError]);

  const handleValidationError = useCallback((errors: Record<string, string[]>, context?: string) => {
    const appError = ErrorHandler.handleValidationError(errors);
    const title = context ? `Error de validación en ${context}` : 'Error de validación';
    showError(title, appError.message);
    return appError;
  }, [showError]);

  return {
    handleError,
    handleSupabaseError,
    handleNetworkError,
    handleValidationError
  };
};
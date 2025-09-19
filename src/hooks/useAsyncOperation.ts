'use client';

import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { useToast } from '@/components/ui/Toast';

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorContext?: string;
}

export const useAsyncOperation = <T = any>(options: UseAsyncOperationOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<T | null>(null);
  
  const { handleError } = useErrorHandler();
  const { showSuccess } = useToast();

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setData(result);
      
      if (options.successMessage) {
        showSuccess('Éxito', options.successMessage);
      }
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err);
      handleError(err, options.errorContext);
      
      if (options.onError) {
        options.onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError, showSuccess, options]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
};
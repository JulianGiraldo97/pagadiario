'use client';

import { useState, useRef, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MobileImageLoaderProps {
  onImageLoad: (file: File) => void;
  onCancel: () => void;
  maxSizeKB?: number;
  quality?: number;
  className?: string;
}

export default function MobileImageLoader({
  onImageLoad,
  onCancel,
  maxSizeKB = 500, // 500KB default for mobile
  quality = 0.8,
  className = ''
}: MobileImageLoaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSlowConnection } = useNetworkStatus();

  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Progressive sizing based on connection
        const maxDimension = isSlowConnection ? 800 : 1200;
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx?.drawImage(img, 0, 0, width, height);

        // Progressive compression
        let currentQuality = isSlowConnection ? 0.6 : quality;
        
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const sizeKB = blob.size / 1024;
                
                if (sizeKB <= maxSizeKB || q <= 0.3) {
                  // Success or minimum quality reached
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                } else {
                  // Try with lower quality
                  setProgress(Math.round((quality - q) / quality * 100));
                  setTimeout(() => tryCompress(q - 0.1), 100);
                }
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            q
          );
        };

        tryCompress(currentQuality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, [maxSizeKB, quality, isSlowConnection]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede ser mayor a 10MB');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const compressedFile = await compressImage(file);
      onImageLoad(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error al procesar la imagen. Intenta con otra imagen.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [compressImage, onImageLoad]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`mobile-image-loader ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {isProcessing ? (
        <div className="text-center py-4">
          <div className="mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Procesando...</span>
            </div>
          </div>
          <h6>Optimizando imagen...</h6>
          <div className="progress mb-2" style={{ height: '8px' }}>
            <div 
              className="progress-bar bg-primary" 
              role="progressbar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <small className="text-muted">
            {isSlowConnection ? 'Compresión alta para conexión lenta' : 'Optimizando para móvil'}
          </small>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="mb-4">
            <i className="bi bi-camera display-1 text-primary"></i>
          </div>
          
          <h5 className="mb-3">Capturar Evidencia</h5>
          <p className="text-muted mb-4">
            La imagen será optimizada automáticamente para móvil
          </p>

          <div className="d-grid gap-2">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleCameraClick}
            >
              <i className="bi bi-camera me-2"></i>
              Abrir Cámara
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
          </div>

          <div className="mt-3">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Tamaño máximo: {maxSizeKB}KB • Calidad: {isSlowConnection ? 'Reducida' : 'Alta'}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
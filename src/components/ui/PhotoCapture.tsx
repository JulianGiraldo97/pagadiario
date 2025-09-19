'use client';

import { useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import OptimizedImage from './OptimizedImage';

interface PhotoCaptureProps {
  onPhotoCapture: (file: File) => void;
  onCancel: () => void;
  existingPhoto?: string;
}

export default function PhotoCapture({ onPhotoCapture, onCancel, existingPhoto }: PhotoCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhoto || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { isSlowConnection } = useNetworkStatus();

  // Image compression function for mobile optimization
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1200px width for mobile)
        const maxWidth = isMobile ? 1200 : 1920;
        const maxHeight = isMobile ? 1200 : 1920;
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          isSlowConnection ? 0.6 : 0.8 // Lower quality for slow connections
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, [isMobile, isSlowConnection]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (10MB max before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede ser mayor a 10MB');
      return;
    }

    setIsCompressing(true);

    try {
      // Compress image for mobile optimization
      const compressedFile = await compressImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);

      onPhotoCapture(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error al procesar la imagen');
    } finally {
      setIsCompressing(false);
    }
  }, [onPhotoCapture, compressImage]);

  const handleCameraClick = () => {
    setIsCapturing(true);
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setIsCapturing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="photo-capture">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {previewUrl ? (
        // Photo preview
        <div className="text-center">
          <div className="mb-3">
            <OptimizedImage
              src={previewUrl}
              alt="Foto capturada"
              className="img-fluid rounded"
              style={{ maxHeight: '300px', maxWidth: '100%' }}
            />
          </div>
          
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleRetake}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Tomar otra
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => {
                // Photo is already captured via onPhotoCapture
                // This just confirms the selection
              }}
            >
              <i className="bi bi-check-lg me-1"></i>
              Usar esta foto
            </button>
          </div>
        </div>
      ) : (
        // Camera interface
        <div className="text-center py-4">
          <div className="mb-4">
            <i className="bi bi-camera display-1 text-muted"></i>
          </div>
          
          <h5 className="mb-3">Capturar Evidencia</h5>
          <p className="text-muted mb-4">
            {isMobile 
              ? 'Toca el botón para abrir la cámara'
              : 'Selecciona una imagen desde tu dispositivo'
            }
          </p>

          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCameraClick}
              disabled={isCapturing || isCompressing}
            >
              {isCompressing ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Procesando...</span>
                  </div>
                  Procesando...
                </>
              ) : (
                <>
                  <i className="bi bi-camera me-1"></i>
                  {isMobile ? 'Abrir Cámara' : 'Seleccionar Imagen'}
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={isCompressing}
            >
              Cancelar
            </button>
          </div>

          {isMobile && (
            <div className="mt-3">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                La cámara se abrirá automáticamente
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
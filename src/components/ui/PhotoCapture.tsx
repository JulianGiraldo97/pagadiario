'use client';

import { useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PhotoCaptureProps {
  onPhotoCapture: (file: File) => void;
  onCancel: () => void;
  existingPhoto?: string;
}

export default function PhotoCapture({ onPhotoCapture, onCancel, existingPhoto }: PhotoCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhoto || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede ser mayor a 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onPhotoCapture(file);
  }, [onPhotoCapture]);

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
            <img
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
              disabled={isCapturing}
            >
              <i className="bi bi-camera me-1"></i>
              {isMobile ? 'Abrir Cámara' : 'Seleccionar Imagen'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
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
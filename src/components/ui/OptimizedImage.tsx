'use client';

import { useState, useRef, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  lowQualitySrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  style,
  placeholder,
  lowQualitySrc,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const { isSlowConnection } = useNetworkStatus();

  useEffect(() => {
    // Choose appropriate image source based on connection
    if (isSlowConnection && lowQualitySrc) {
      setCurrentSrc(lowQualitySrc);
    } else {
      setCurrentSrc(src);
    }
  }, [src, lowQualitySrc, isSlowConnection]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (imgRef.current) {
      imgRef.current.src = currentSrc;
    }
  };

  if (hasError) {
    return (
      <div 
        className={`d-flex flex-column align-items-center justify-content-center bg-light text-muted ${className}`}
        style={{ minHeight: '200px', ...style }}
      >
        <i className="bi bi-image display-4 mb-2"></i>
        <p className="mb-2">Error al cargar imagen</p>
        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={handleRetry}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="position-relative">
      {isLoading && (
        <div 
          className={`position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light ${className}`}
          style={style}
        >
          {placeholder ? (
            <img 
              src={placeholder} 
              alt={alt}
              className="w-100 h-100 object-fit-cover opacity-50"
            />
          ) : (
            <div className="text-center">
              <div className="spinner-border text-primary mb-2" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted small mb-0">Cargando imagen...</p>
            </div>
          )}
        </div>
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          transition: 'opacity 0.3s ease',
          ...style
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      
      {isSlowConnection && (
        <div className="position-absolute top-0 end-0 m-2">
          <span className="badge bg-warning">
            <i className="bi bi-wifi-1 me-1"></i>
            Calidad reducida
          </span>
        </div>
      )}
    </div>
  );
}
'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  fullScreen = false,
  className = ''
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'spinner-border-sm';
      case 'lg': return 'spinner-border-lg';
      default: return '';
    }
  };

  const spinner = (
    <div className={`spinner-border text-${variant} ${getSizeClass()} ${className}`} role="status">
      <span className="visually-hidden">Cargando...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 1050 }}>
        <div className="text-center">
          {spinner}
          {text && <div className="mt-3 text-muted">{text}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center">
      {spinner}
      {text && <span className="ms-2 text-muted">{text}</span>}
    </div>
  );
};

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary' | 'outline-secondary';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary'
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      )}
      {children}
    </button>
  );
};

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  text = 'Cargando...',
  className = ''
}) => {
  return (
    <div className={`position-relative ${className}`}>
      {children}
      {loading && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 rounded">
          <div className="text-center">
            <LoadingSpinner />
            <div className="mt-2 text-muted small">{text}</div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  animated = true
}) => {
  return (
    <div
      className={`bg-light rounded ${animated ? 'placeholder-glow' : ''} ${className}`}
      style={{ width, height }}
    >
      {animated && <span className="placeholder w-100 h-100"></span>}
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index}>
                <Skeleton height="1.5rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  <Skeleton height="1.25rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
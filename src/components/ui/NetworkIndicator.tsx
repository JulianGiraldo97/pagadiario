'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface NetworkIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export default function NetworkIndicator({ showDetails = false, className = '' }: NetworkIndicatorProps) {
  const { isOnline, isSlowConnection, connectionType } = useNetworkStatus();

  if (isOnline && !isSlowConnection && !showDetails) {
    return null; // Don't show anything when connection is good
  }

  const getStatusColor = () => {
    if (!isOnline) return 'text-danger';
    if (isSlowConnection) return 'text-warning';
    return 'text-success';
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'bi-wifi-off';
    if (isSlowConnection) return 'bi-wifi-1';
    return 'bi-wifi';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (isSlowConnection) return 'Conexión lenta';
    return 'Conectado';
  };

  return (
    <div className={`d-flex align-items-center ${className}`}>
      <i className={`bi ${getStatusIcon()} ${getStatusColor()} me-1`}></i>
      <small className={getStatusColor()}>
        {getStatusText()}
        {showDetails && connectionType !== 'unknown' && (
          <span className="ms-1">({connectionType})</span>
        )}
      </small>
    </div>
  );
}
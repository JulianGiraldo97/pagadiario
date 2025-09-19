'use client';

import { ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import NetworkIndicator from '@/components/ui/NetworkIndicator';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showNetworkStatus?: boolean;
  className?: string;
}

export default function MobileLayout({ 
  children, 
  title, 
  showNetworkStatus = true,
  className = '' 
}: MobileLayoutProps) {
  const { isOnline } = useNetworkStatus();

  return (
    <div className={`mobile-layout ${className}`}>
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          <i className="bi bi-wifi-off me-2"></i>
          Sin conexión a internet
        </div>
      )}

      {/* Header */}
      {title && (
        <div className="sticky-top bg-white border-bottom shadow-sm">
          <div className="container-fluid p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">{title}</h4>
              {showNetworkStatus && <NetworkIndicator />}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mobile-content">
        {children}
      </div>

      <style jsx>{`
        .mobile-layout {
          min-height: 100vh;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .mobile-content {
          padding-bottom: 100px; /* Space for fixed bottom elements */
        }

        @media (max-width: 768px) {
          .mobile-layout {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
        }
      `}</style>
    </div>
  );
}
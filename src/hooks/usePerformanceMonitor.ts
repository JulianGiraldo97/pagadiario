'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  memoryUsage?: number;
  loadTime: number;
  isSlowDevice: boolean;
  connectionSpeed: 'fast' | 'slow' | 'offline';
}

export function usePerformanceMonitor(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    isSlowDevice: false,
    connectionSpeed: 'fast'
  });

  useEffect(() => {
    const measurePerformance = () => {
      // Measure page load time
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;

      // Detect slow device (basic heuristic)
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        Math.random();
      }
      const end = performance.now();
      const isSlowDevice = (end - start) > 50; // If simple loop takes more than 50ms

      // Memory usage (if available)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize;

      // Connection speed estimation
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      let connectionSpeed: 'fast' | 'slow' | 'offline' = 'fast';
      
      if (!navigator.onLine) {
        connectionSpeed = 'offline';
      } else if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          connectionSpeed = 'slow';
        }
      }

      setMetrics({
        memoryUsage,
        loadTime,
        isSlowDevice,
        connectionSpeed
      });
    };

    // Initial measurement
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    // Monitor connection changes
    const handleOnline = () => setMetrics(prev => ({ ...prev, connectionSpeed: 'fast' }));
    const handleOffline = () => setMetrics(prev => ({ ...prev, connectionSpeed: 'offline' }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('load', measurePerformance);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return metrics;
}
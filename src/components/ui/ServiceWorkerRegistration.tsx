'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/utils/serviceWorker';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production and on mobile
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
      registerServiceWorker();
    }
  }, []);

  return null; // This component doesn't render anything
}
'use client';

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // console.log('Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, show update notification
                showUpdateNotification();
              }
            });
          }
        });

        // Handle background sync registration
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          // Register for background sync
          await (registration as any).sync.register('payment-sync');
        }

      } catch (error) {
        // console.error('Service Worker registration failed:', error);
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        // console.log('Cache updated:', event.data.payload);
      }
    });
  }
}

function showUpdateNotification() {
  // Show a notification that new content is available
  if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
    window.location.reload();
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        // console.error('Service Worker unregistration failed:', error);
      });
  }
}

// Queue actions for background sync when offline
export function queueForSync(action: string, data: any) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // Store in IndexedDB for background sync
      storeForSync(action, data);
      
      // Register sync event
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        (registration as any).sync.register('payment-sync');
      }
    });
  }
}

// Simple IndexedDB wrapper for offline storage
function storeForSync(action: string, data: any) {
  const request = indexedDB.open('OfflineActions', 1);
  
  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('actions')) {
      db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
    }
  };
  
  request.onsuccess = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    const transaction = db.transaction(['actions'], 'readwrite');
    const store = transaction.objectStore('actions');
    
    store.add({
      action,
      data,
      timestamp: Date.now(),
      synced: false
    });
  };
}
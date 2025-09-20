'use client'

import { ReactNode } from 'react'
import ClientOnly from '@/components/ClientOnly'
import { AuthProvider } from '@/lib/auth/AuthContext'
import BootstrapClient from '@/components/ui/BootstrapClient'
import ServiceWorkerRegistration from '@/components/ui/ServiceWorkerRegistration'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'

interface ClientAppProps {
  children: ReactNode
}

export default function ClientApp({ children }: ClientAppProps) {
  return (
    <ClientOnly fallback={
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    }>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
        <BootstrapClient />
        <ServiceWorkerRegistration />
      </ErrorBoundary>
    </ClientOnly>
  )
}

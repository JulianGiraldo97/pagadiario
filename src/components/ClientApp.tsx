'use client'

import { ReactNode } from 'react'
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
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
      <BootstrapClient />
      <ServiceWorkerRegistration />
    </ErrorBoundary>
  )
}

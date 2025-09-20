import type { Metadata, Viewport } from 'next'
import 'bootstrap/dist/css/bootstrap.min.css'

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'
import BootstrapClient from '@/components/ui/BootstrapClient'
import ServiceWorkerRegistration from '@/components/ui/ServiceWorkerRegistration'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Sistema de Paga Diario',
  description: 'Sistema de gestión de cobros diarios optimizado para móvil',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Paga Diario'
  },
  formatDetection: {
    telephone: false
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Paga Diario',
    'application-name': 'Paga Diario',
    'msapplication-TileColor': '#0d6efd',
    'msapplication-tap-highlight': 'no'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0d6efd'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
      </head>
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
        <BootstrapClient />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
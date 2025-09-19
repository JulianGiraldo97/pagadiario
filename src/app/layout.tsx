import type { Metadata } from 'next'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'
import BootstrapClient from '@/components/ui/BootstrapClient'
import ServiceWorkerRegistration from '@/components/ui/ServiceWorkerRegistration'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Sistema de Paga Diario',
  description: 'Sistema de gestión de cobros diarios optimizado para móvil',
  manifest: '/manifest.json',
  themeColor: '#0d6efd',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <BootstrapClient />
        <ServiceWorkerRegistration />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
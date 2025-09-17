import type { Metadata } from 'next'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'
import BootstrapClient from '@/components/ui/BootstrapClient'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Sistema de Paga Diario',
  description: 'Sistema de gestión de cobros diarios',
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
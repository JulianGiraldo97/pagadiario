import type { Metadata } from 'next'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'
import BootstrapClient from '@/components/ui/BootstrapClient'

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
      </body>
    </html>
  )
}
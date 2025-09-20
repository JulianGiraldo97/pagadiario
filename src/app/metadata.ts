import type { Metadata, Viewport } from 'next'

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

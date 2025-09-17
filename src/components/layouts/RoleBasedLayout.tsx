'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import AdminLayout from './AdminLayout'
import CollectorLayout from './CollectorLayout'

interface RoleBasedLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  showBackButton?: boolean
  backHref?: string
}

export default function RoleBasedLayout({
  children,
  title,
  subtitle,
  actions,
  showBackButton,
  backHref
}: RoleBasedLayoutProps) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (profile?.role === 'admin') {
    return (
      <AdminLayout
        title={title}
        subtitle={subtitle}
        actions={actions}
      >
        {children}
      </AdminLayout>
    )
  }

  if (profile?.role === 'collector') {
    return (
      <CollectorLayout
        title={title}
        subtitle={subtitle}
        actions={actions}
        showBackButton={showBackButton}
        backHref={backHref}
      >
        {children}
      </CollectorLayout>
    )
  }

  return null
}
'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface CollectorLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
  actions?: React.ReactNode
}

export default function CollectorLayout({ 
  children, 
  title, 
  subtitle,
  showBackButton = false,
  backHref = '/collector',
  actions 
}: CollectorLayoutProps) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile?.role !== 'collector') {
      router.push('/admin')
    }
  }, [profile, loading, router])

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

  if (profile?.role !== 'collector') {
    return null
  }

  const handleBack = () => {
    router.push(backHref)
  }

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {(title || showBackButton || actions) && (
        <div className="row mb-3">
          <div className="col">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center flex-grow-1">
                {showBackButton && (
                  <button
                    onClick={handleBack}
                    className="btn btn-link text-primary p-0 me-3 d-flex align-items-center"
                    style={{ textDecoration: 'none' }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>←</span>
                  </button>
                )}
                <div className="flex-grow-1">
                  {title && (
                    <h1 className="h4 mb-1 text-dark fw-bold">{title}</h1>
                  )}
                  {subtitle && (
                    <p className="text-muted mb-0 small">{subtitle}</p>
                  )}
                </div>
              </div>
              {actions && (
                <div className="d-flex gap-2 ms-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="row">
        <div className="col">
          {children}
        </div>
      </div>
    </div>
  )
}
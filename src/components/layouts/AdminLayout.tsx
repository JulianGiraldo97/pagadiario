'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function AdminLayout({ 
  children, 
  title, 
  subtitle, 
  actions 
}: AdminLayoutProps) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      router.push('/collector')
    }
  }, [profile, loading, router])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="container-fluid py-4">
      {(title || actions) && (
        <div className="row mb-4">
          <div className="col">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div className="mb-3 mb-md-0">
                {title && (
                  <h1 className="h3 mb-1 text-dark fw-bold">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-muted mb-0">{subtitle}</p>
                )}
              </div>
              {actions && (
                <div className="d-flex gap-2 flex-wrap">
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
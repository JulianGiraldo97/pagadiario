'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { UserRole } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If no user, redirect to login
      if (!user) {
        router.push('/login')
        return
      }

      // If user exists but no profile, wait for profile to load
      if (!profile) {
        return
      }

      // If specific roles are required, check if user has permission
      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        const defaultRedirect = profile.role === 'admin' ? '/admin' : '/collector'
        router.push(redirectTo || defaultRedirect)
        return
      }
    }
  }, [user, profile, loading, allowedRoles, redirectTo, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  // Don't render children if user is not authenticated or doesn't have permission
  if (!user || !profile) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return null
  }

  return <>{children}</>
}
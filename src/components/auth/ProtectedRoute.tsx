'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { UserRole } from '@/lib/types'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { securityLogger, SecurityLogLevel, SecurityEventType, hasPermission } from '@/lib/utils/security'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
  requireExactRole?: boolean
  logAccess?: boolean
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo,
  requireExactRole = false,
  logAccess = true
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [accessGranted, setAccessGranted] = useState(false)

  useEffect(() => {
    if (!loading) {
      // If no user, redirect to login
      if (!user) {
        if (logAccess) {
          securityLogger.log({
            level: SecurityLogLevel.WARNING,
            event: SecurityEventType.UNAUTHORIZED_ACCESS,
            path: pathname,
            details: { reason: 'No authenticated user' }
          })
        }
        router.push('/login')
        return
      }

      // If user exists but no profile, wait for profile to load
      if (!profile) {
        if (logAccess) {
          securityLogger.log({
            level: SecurityLogLevel.WARNING,
            event: SecurityEventType.UNAUTHORIZED_ACCESS,
            userId: user.id,
            path: pathname,
            details: { reason: 'Profile not loaded' }
          })
        }
        return
      }

      // Check role-based access
      if (allowedRoles && allowedRoles.length > 0) {
        let hasAccess = false
        
        if (requireExactRole) {
          // Exact role match required
          hasAccess = allowedRoles.includes(profile.role)
        } else {
          // Hierarchical permission check
          hasAccess = allowedRoles.some(role => hasPermission(profile.role, role))
        }

        if (!hasAccess) {
          if (logAccess) {
            securityLogger.log({
              level: SecurityLogLevel.WARNING,
              event: SecurityEventType.ROLE_VIOLATION,
              userId: user.id,
              userRole: profile.role,
              path: pathname,
              details: { 
                requiredRoles: allowedRoles,
                actualRole: profile.role,
                requireExactRole
              }
            })
          }
          
          const defaultRedirect = profile.role === 'admin' ? '/admin' : '/collector'
          router.push(redirectTo || defaultRedirect)
          return
        }
      }

      // Access granted - log successful access to protected routes
      if (logAccess && allowedRoles) {
        securityLogger.log({
          level: SecurityLogLevel.INFO,
          event: SecurityEventType.DATA_ACCESS,
          userId: user.id,
          userRole: profile.role,
          path: pathname,
          success: true,
          details: { 
            allowedRoles,
            grantedRole: profile.role
          }
        })
      }

      setAccessGranted(true)
    }
  }, [user, profile, loading, allowedRoles, redirectTo, requireExactRole, logAccess, router, pathname])

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
  if (!user || !profile || !accessGranted) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-shield-exclamation me-2"></i>
          Verificando permisos de acceso...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
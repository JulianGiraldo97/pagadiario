'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navigation() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(true)

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleNavbar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const isActive = (path: string) => {
    return pathname === path ? 'active' : ''
  }

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/clients', label: 'Clientes', icon: '👥' },
    { href: '/admin/debts', label: 'Deudas', icon: '💳' },
    { href: '/admin/collectors', label: 'Cobradores', icon: '🚶' },
    { href: '/admin/routes', label: 'Rutas', icon: '🗺️' },
    { href: '/admin/reports', label: 'Reportes', icon: '📈' },
    { href: '/admin/test-route', label: 'Prueba Ruta', icon: '🧪' },
  ]

  const collectorNavItems = [
    { href: '/collector', label: 'Mi Ruta', icon: '🗺️' },
    { href: '/collector/payments', label: 'Pagos', icon: '💰' },
  ]

  const navItems = profile?.role === 'admin' ? adminNavItems : collectorNavItems

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        {/* Brand */}
        <Link 
          className="navbar-brand fw-bold" 
          href={profile?.role === 'admin' ? '/admin' : '/collector'}
        >
          <span className="d-none d-md-inline">Sistema de Paga Diario</span>
          <span className="d-md-none">SPD</span>
        </Link>

        {/* Mobile toggle button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={toggleNavbar}
          aria-controls="navbarNav"
          aria-expanded={!isCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation items */}
        <div className={`collapse navbar-collapse ${!isCollapsed ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto">
            {navItems.map((item) => (
              <li key={item.href} className="nav-item">
                <Link 
                  className={`nav-link ${isActive(item.href)}`}
                  href={item.href}
                  onClick={() => setIsCollapsed(true)}
                >
                  <span className="me-1">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* User menu */}
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="d-flex align-items-center">
                  <div className="bg-light rounded-circle me-2 d-flex align-items-center justify-content-center" 
                       style={{ width: '32px', height: '32px' }}>
                    <span className="text-primary fw-bold">
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="d-none d-lg-block">
                    <div className="fw-semibold">{profile?.full_name}</div>
                    <small className="text-light opacity-75">
                      {profile?.role === 'admin' ? 'Administrador' : 'Cobrador'}
                    </small>
                  </div>
                </div>
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <div className="dropdown-item-text d-lg-none">
                    <div className="fw-semibold">{profile?.full_name}</div>
                    <small className="text-muted">
                      {profile?.role === 'admin' ? 'Administrador' : 'Cobrador'}
                    </small>
                  </div>
                </li>
                <li className="d-lg-none"><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={handleSignOut}
                  >
                    <span className="me-2">🚪</span>
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
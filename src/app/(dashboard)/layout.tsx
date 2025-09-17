'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <ProtectedRoute>
      <div className="min-vh-100">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <div className="container-fluid">
            <Link className="navbar-brand" href={profile?.role === 'admin' ? '/admin' : '/collector'}>
              Sistema de Paga Diario
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav me-auto">
                {profile?.role === 'admin' && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" href="/admin">
                        Dashboard
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" href="/admin/clients">
                        Clientes
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" href="/admin/collectors">
                        Cobradores
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" href="/admin/routes">
                        Rutas
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" href="/admin/reports">
                        Reportes
                      </Link>
                    </li>
                  </>
                )}
                {profile?.role === 'collector' && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" href="/collector">
                        Mi Ruta
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" href="/collector/payments">
                        Pagos
                      </Link>
                    </li>
                  </>
                )}
              </ul>
              <ul className="navbar-nav">
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                  >
                    {profile?.full_name}
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={handleSignOut}
                      >
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <main className="container-fluid py-4">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
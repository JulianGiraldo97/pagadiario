'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import Navigation from '@/components/ui/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-vh-100 d-flex flex-column">
        <Navigation />
        <main className="flex-grow-1">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
'use client'

import { useEffect, useState } from 'react'

interface ClientOnlyAppProps {
  children: React.ReactNode
}

export default function ClientOnlyApp({ children }: ClientOnlyAppProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

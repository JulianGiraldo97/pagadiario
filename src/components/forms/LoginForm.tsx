'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { logDiagnostics } from '@/lib/supabase/diagnostics'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  // Handle redirect after successful authentication
  useEffect(() => {
    // Only redirect if we have both user and profile, and we're not in the initial loading state
    if (user && profile && !authLoading) {
      const redirectPath = profile.role === 'admin' ? '/admin' : '/collector'
      router.push(redirectPath)
    }
  }, [user, profile, authLoading, router])

  // Show loading spinner if auth is still loading initially (with timeout)
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingTimeout(true)
    }, 3000) // Show form after 3 seconds regardless

    return () => clearTimeout(timer)
  }, [])

  if (authLoading && !showLoadingTimeout) {
    return (
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted">Verificando sesión...</p>
      </div>
    )
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        console.error('Login error:', error)
        
        // Run diagnostics on error
        if (error.message?.includes('fetch') || error.message?.includes('CORS') || error.message?.includes('502')) {
          console.log('Running Supabase diagnostics due to connection error...')
          logDiagnostics()
        }
        
        setError(error.message || 'Error al iniciar sesión')
        setIsLoading(false)
      }
      // If successful, the useEffect will handle the redirect
      // Don't set isLoading to false here - let the redirect happen
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('Error inesperado al iniciar sesión')
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-muted">Inicia sesión para continuar</p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Correo electrónico
          </label>
          <input
            type="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            id="email"
            {...register('email', {
              required: 'El correo electrónico es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Ingresa un correo electrónico válido',
              },
            })}
            disabled={isLoading}
          />
          {errors.email && (
            <div className="invalid-feedback">
              {errors.email.message}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Contraseña
          </label>
          <input
            type="password"
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            id="password"
            {...register('password', {
              required: 'La contraseña es requerida',
              minLength: {
                value: 6,
                message: 'La contraseña debe tener al menos 6 caracteres',
              },
            })}
            disabled={isLoading}
          />
          {errors.password && (
            <div className="invalid-feedback">
              {errors.password.message}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Iniciando sesión...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </button>
      </form>

      {/* Diagnostic button - only show in development or when there are connection issues */}
      {(process.env.NODE_ENV === 'development' || error?.includes('fetch') || error?.includes('CORS')) && (
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm w-100"
            onClick={() => {
              console.log('Running manual diagnostics...')
              logDiagnostics()
            }}
          >
            🔍 Ejecutar Diagnósticos de Conexión
          </button>
        </div>
      )}
    </>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'


interface LoginFormData {
  email: string
  password: string
}

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryStatus, setRetryStatus] = useState<string | null>(null)
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
    setRetryStatus(null)

    try {
      // Show retry status for user feedback
      const originalConsoleLog = console.log
      console.log = (...args) => {
        if (args[0]?.includes('retrying')) {
          setRetryStatus('Reintentando conexión...')
        } else if (args[0]?.includes('initializing')) {
          setRetryStatus('Servicio inicializándose, reintentando...')
        }
        originalConsoleLog(...args)
      }

      const { error } = await signIn(data.email, data.password)

      // Restore original console.log
      console.log = originalConsoleLog
      setRetryStatus(null)

      if (error) {
        console.error('Login error:', error)
        

        
        setError(error.message || 'Error al iniciar sesión')
        setIsLoading(false)
      }
      // If successful, the useEffect will handle the redirect
      // Don't set isLoading to false here - let the redirect happen
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('Error inesperado al iniciar sesión')
      setIsLoading(false)
      setRetryStatus(null)
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
          {error.includes('inicializándose') && (
            <div className="mt-2">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Los proyectos restaurados pueden tardar hasta 5 minutos en estar completamente operativos.
              </small>
            </div>
          )}
        </div>
      )}

      {retryStatus && (
        <div className="alert alert-info" role="alert">
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            {retryStatus}
          </div>
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


    </>
  )
}
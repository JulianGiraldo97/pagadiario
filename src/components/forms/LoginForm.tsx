'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useToast } from '@/components/ui/Toast'
import { LoadingButton } from '@/components/ui/LoadingSpinner'


interface LoginFormData {
  email: string
  password: string
}

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [retryStatus, setRetryStatus] = useState<string | null>(null)
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { handleError } = useErrorHandler()
  const { showInfo } = useToast()

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
    setRetryStatus(null)

    try {
      // Show retry status for user feedback
      const originalConsoleLog = console.log
      console.log = (...args) => {
        if (args[0]?.includes('retrying')) {
          setRetryStatus('Reintentando conexión...')
        } else if (args[0]?.includes('initializing')) {
          setRetryStatus('Servicio inicializándose, reintentando...')
          showInfo('Inicializando', 'El servicio se está inicializando, esto puede tomar unos minutos...')
        }
        originalConsoleLog(...args)
      }

      const { error } = await signIn(data.email, data.password)

      // Restore original console.log
      console.log = originalConsoleLog
      setRetryStatus(null)

      if (error) {
        handleError(error, 'inicio de sesión')
        setIsLoading(false)
      }
      // If successful, the useEffect will handle the redirect
      // Don't set isLoading to false here - let the redirect happen
    } catch (err) {
      handleError(err, 'inicio de sesión')
      setIsLoading(false)
      setRetryStatus(null)
    }
  }

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-muted">Inicia sesión para continuar</p>
      </div>



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

        <LoadingButton
          type="submit"
          className="w-100"
          loading={isLoading}
          variant="primary"
        >
          Iniciar sesión
        </LoadingButton>
      </form>


    </>
  )
}
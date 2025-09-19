'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

// Simplified profile type based on Supabase user
interface SimpleProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'collector'
}

interface AuthContextType {
  user: User | null
  profile: SimpleProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<SimpleProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const createProfileFromUser = (user: User): SimpleProfile => {
    // Determine role based on email (simple logic for now)
    const role = user.email?.includes('admin') ? 'admin' : 'collector'
    const fullName = user.email?.includes('admin') ? 'Administrador Sistema' : 'Usuario'

    return {
      id: user.id,
      email: user.email || '',
      full_name: fullName,
      role: role
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = createProfileFromUser(user)
      setProfile(profileData)
    }
  }

  const signIn = async (email: string, password: string, retryCount = 0) => {
    const maxRetries = 3
    const retryDelay = 2000 // 2 seconds

    // Import security logger dynamically to avoid circular dependencies
    const { securityLogger, SecurityLogLevel, SecurityEventType } = await import('@/lib/utils/security')

    try {
      console.log(`Attempting to sign in with Supabase... (attempt ${retryCount + 1}/${maxRetries + 1})`)

      // Log login attempt
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.LOGIN_ATTEMPT,
        details: { 
          email: email.toLowerCase(),
          attempt: retryCount + 1,
          maxRetries: maxRetries + 1
        }
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase auth error:', error)

        // Log login failure
        securityLogger.log({
          level: SecurityLogLevel.WARNING,
          event: SecurityEventType.LOGIN_FAILURE,
          details: { 
            email: email.toLowerCase(),
            error: error.message,
            attempt: retryCount + 1
          }
        })

        // Handle 502 Bad Gateway specifically (service initializing)
        if (error.message.includes('fetch') && retryCount < maxRetries) {
          console.log(`Service may be initializing, retrying in ${retryDelay / 1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return signIn(email, password, retryCount + 1)
        }

        // Handle specific error types
        if (error.message.includes('fetch')) {
          return {
            error: {
              message: 'El servicio de Supabase está inicializándose. Por favor, espera unos minutos e intenta nuevamente.'
            }
          }
        }

        if (error.message.includes('CORS')) {
          return {
            error: {
              message: 'Error de configuración CORS. El servicio puede estar inicializándose.'
            }
          }
        }

        return { error }
      }

      console.log('Sign in successful')
      
      // Log successful login
      if (data.user) {
        securityLogger.log({
          level: SecurityLogLevel.INFO,
          event: SecurityEventType.LOGIN_SUCCESS,
          userId: data.user.id,
          details: { 
            email: email.toLowerCase(),
            attempt: retryCount + 1
          },
          success: true
        })
      }
      
      return { error: null }
    } catch (error) {
      console.error('Unexpected error during sign in:', error)

      // Log unexpected error
      securityLogger.log({
        level: SecurityLogLevel.ERROR,
        event: SecurityEventType.LOGIN_FAILURE,
        details: { 
          email: email.toLowerCase(),
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt: retryCount + 1,
          type: 'unexpected_error'
        }
      })

      // Retry on network errors
      if (error instanceof TypeError && error.message.includes('fetch') && retryCount < maxRetries) {
        console.log(`Network error, retrying in ${retryDelay / 1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return signIn(email, password, retryCount + 1)
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          error: {
            message: 'El servicio de Supabase no está disponible. Puede estar inicializándose después de una restauración. Intenta nuevamente en unos minutos.'
          }
        }
      }

      return {
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido durante el inicio de sesión'
        }
      }
    }
  }

  const signOut = async () => {
    try {
      // Import security logger dynamically
      const { securityLogger, SecurityLogLevel, SecurityEventType } = await import('@/lib/utils/security')
      
      // Log logout attempt
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.LOGOUT,
        userId: user?.id,
        userRole: profile?.role,
        details: { action: 'user_logout' }
      })

      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }

        if (session?.user && mounted) {
          setUser(session.user)
          const profileData = createProfileFromUser(session.user)
          setProfile(profileData)
        } else if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && mounted) {
          setUser(session.user)
          const profileData = createProfileFromUser(session.user)
          setProfile(profileData)
        } else if (mounted) {
          setUser(null)
          setProfile(null)
        }

        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
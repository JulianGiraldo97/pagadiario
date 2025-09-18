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

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with Supabase...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase auth error:', error)
        
        // Handle specific error types
        if (error.message.includes('fetch')) {
          return { 
            error: { 
              message: 'Error de conexión. Verifica tu conexión a internet y que el servicio de Supabase esté disponible.' 
            } 
          }
        }
        
        if (error.message.includes('CORS')) {
          return { 
            error: { 
              message: 'Error de configuración CORS. Contacta al administrador del sistema.' 
            } 
          }
        }
        
        return { error }
      }

      console.log('Sign in successful')
      return { error: null }
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          error: { 
            message: 'No se puede conectar al servidor de autenticación. Verifica tu conexión a internet.' 
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
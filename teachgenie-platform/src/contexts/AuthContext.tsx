'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: {
    firstName: string
    lastName: string
    userType: 'student' | 'tutor'
  }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
    if (!data.user) {
      throw new Error('No user data returned')
    }
    router.push('/dashboard')
  }

  const signUp = async (
    email: string,
    password: string,
    userData: {
      firstName: string
      lastName: string
      userType: 'student' | 'tutor'
    }
  ) => {
    console.log('Starting signup process...')
    // Dynamically set redirect URL
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`;
    // Create auth user only - profiles will be created after email verification
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          user_type: userData.userType,
        },
        emailRedirectTo: redirectTo,
      }
    })
    if (authError) {
      console.error('Auth signup error:', authError)
      throw authError
    }
    if (!authData.user) {
      console.error('No user data returned from signup')
      throw new Error('Failed to create user')
    }
    console.log('Auth user created successfully:', authData.user.id)
    console.log('Redirecting to verification page...')
    // Redirect to verification page - profiles will be created after verification
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
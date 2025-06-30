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
    console.log('AuthProvider: Setting up auth listeners')
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Initial session check:', session ? 'exists' : 'none')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider: Auth state change:', event, session ? 'user exists' : 'no user')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      console.log('AuthProvider: Cleaning up auth listeners')
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Signing in user:', email)
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
    console.log('AuthProvider: Sign in successful, redirecting to dashboard')
    // Use replace to avoid navigation conflicts and add a small delay
    setTimeout(() => {
      window.location.replace('/dashboard')
    }, 100)
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
    
    // Get the current URL for redirect
    // NOTE: This redirectTo parameter is just a suggestion.
    // Supabase will only redirect to URLs that are configured in your Supabase project settings.
    // Make sure to add your production domain to Supabase Auth → URL Configuration → Redirect URLs
    let redirectTo: string
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      const currentPath = window.location.pathname
      redirectTo = `${window.location.origin}/auth/callback` //?next=${encodeURIComponent(currentPath)}`
    } else {
      // Server-side: use environment variable or default
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      redirectTo = `${baseUrl}/auth/callback`
    }
    
    console.log('Redirect URL:', redirectTo)
    
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
    console.log('AuthProvider: Signing out user')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    console.log('AuthProvider: Sign out successful, redirecting to home')
    router.replace('/')
  }

  console.log('AuthProvider: Current state - user:', user ? 'exists' : 'none', 'loading:', loading)

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
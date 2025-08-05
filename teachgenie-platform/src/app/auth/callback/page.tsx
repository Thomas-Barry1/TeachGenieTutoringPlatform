'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // Get the session after OAuth or email verification
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('Authentication failed. Please try again.')
          setTimeout(() => {
            window.location.replace('/auth/login')
          }, 1000)
          setLoading(false)
          return
        }

        if (!session?.user) {
          setError('No user session found. Please try signing in again.')
          setTimeout(() => {
            window.location.replace('/auth/login')
          }, 2000)
          setLoading(false)
          return
        }

        console.log('User authenticated, checking profile...')

        // Check if user already has a profile
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          console.error('Profile check error:', profileCheckError)
          setError('Failed to check profile. Please try again.')
          setLoading(false)
          return
        }

        // If profile doesn't exist, this is a new user
        if (!existingProfile) {
          console.log('No existing profile, creating new profile...')

          // Get user metadata from auth
          let userMetadata = session.user.user_metadata
          console.log('userMetadata: ', userMetadata)
          let { first_name, last_name, user_type } = userMetadata
          
          // For Google OAuth, get name from Google profile
          if (session.user.app_metadata?.provider === 'google') {
            first_name = first_name || userMetadata?.full_name?.split(' ')[0] || userMetadata?.given_name
            last_name = last_name || userMetadata?.full_name?.split(' ').slice(1).join(' ') || userMetadata?.family_name
            
            // For Google OAuth, last name is optional - use first name if no last name
            // if (!last_name && first_name) {
            //   last_name = first_name // Use first name as last name if no last name provided
            // }
          }
          
          // If missing, try to get from localStorage
          if ((!first_name || !last_name || !user_type) && typeof window !== 'undefined') {
            const regInfo = localStorage.getItem('registrationInfo')
            if (regInfo) {
              const parsed = JSON.parse(regInfo)
              first_name = first_name || parsed.firstName
              last_name = last_name || parsed.lastName
              user_type = user_type || parsed.userType
            }
          }
          
          // For Google OAuth, only require first_name and user_type
          // For email registration, require both first_name and last_name
          const isGoogleOAuth = session.user.app_metadata?.provider === 'google'
          const hasRequiredInfo = isGoogleOAuth 
            ? (first_name && user_type) 
            : (first_name && last_name && user_type)
          
          if (!hasRequiredInfo) {
            console.log('Missing user information, redirecting to registration')
            // Clean up any existing session
            await supabase.auth.signOut()
            // Redirect to registration page with a message
            router.push('/auth/register?error=missing_info')
            return
          }

          console.log("User id: ", session.user.id)

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              first_name,
              last_name,
              user_type,
              email: session.user.email,
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            setError('Failed to create profile. Please contact support.')
            setLoading(false)
            return
          }

          console.log('Profile created successfully')

          // If user is a tutor, create tutor profile
          if (user_type === 'tutor') {
            const { error: tutorError } = await supabase
              .from('tutor_profiles')
              .insert({
                id: session.user.id,
                is_verified: false,
              })

            if (tutorError) {
              console.error('Tutor profile creation error:', tutorError)
              setError('Failed to create tutor profile. Please contact support.')
              setLoading(false)
              return
            }

            console.log('Tutor profile created successfully')
          }

          // Clean up registration info
          if (typeof window !== 'undefined') {
            localStorage.removeItem('registrationInfo')
          }
        } else {
          console.log('Existing profile found, user is logging in')
        }

        // Redirect to next param or dashboard
        const next = searchParams.get('next')
        if (next) {
          router.push(next)
        } else {
          router.push('/dashboard')
        }

      } catch (err) {
        console.error('Callback error:', err)
        setError('An unexpected error occurred. Please try again.')
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication Successful!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Setting up your account...
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Account Setup Required
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => router.push('/auth/register')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Complete Registration
                </button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function AuthCallbackPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackPage />
    </Suspense>
  )
} 
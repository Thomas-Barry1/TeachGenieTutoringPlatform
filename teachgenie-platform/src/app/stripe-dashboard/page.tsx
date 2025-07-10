'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function StripeDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    // Set a timeout to show error if user doesn't load within 5 seconds
    const timeout = setTimeout(() => {
      if (!user) {
        setTimeoutReached(true)
        setError('Session loading timeout. Please try again.')
        setLoading(false)
      }
    }, 5000)

    async function redirectToStripeDashboard() {
      // Wait for user to be loaded
      if (!user) {
        return // Don't set error yet, just wait
      }

      clearTimeout(timeout) // Clear timeout since user loaded

      try {
        const response = await fetch('/api/stripe/create-login-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to create login link')
        }

        const { url } = await response.json()
        
        // Redirect to the Stripe Express dashboard in this tab
        window.location.href = url
      } catch (error) {
        console.error('Error creating login link:', error)
        setError('Failed to access Stripe dashboard. Please try again.')
        setLoading(false)
      }
    }

    redirectToStripeDashboard()

    return () => clearTimeout(timeout)
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Opening Stripe Dashboard...
            </h2>
            <p className="text-sm text-gray-600">
              You will be redirected to your Stripe Express dashboard momentarily.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Error Accessing Dashboard
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/payments')}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Return to Payments
              </button>
              {timeoutReached && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
} 
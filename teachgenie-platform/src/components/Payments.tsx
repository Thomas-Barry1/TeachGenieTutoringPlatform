'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Profile = {
  id: string
  user_type: 'student' | 'tutor'
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
}

export default function TutorPayments() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      console.log('Loading profile for user:', user.id)
      const supabase = createClient()
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        setLoading(false)
        return
      }

      console.log('Profile data loaded:', profileData)
      setProfile(profileData)
      setLoading(false)
    }
    loadProfile()
  }, [user])

  useEffect(() => {
    if (profile && profile.user_type === 'tutor') {
      fetch('/api/stripe/tutor-status')
        .then(res => res.json())
        .then(data => setStripeConnected(data.connected))
        .catch(() => setStripeConnected(false))
    }
  }, [profile])

  const handleStripeOnboard = async () => {
    setStripeLoading(true)
    setStripeError(null)
    try {
      const res = await fetch('/api/stripe/onboard-tutor', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setStripeError(data.error || 'Failed to get onboarding link')
      }
    } catch (err) {
      setStripeError('Failed to connect to Stripe')
    } finally {
      setStripeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-white rounded-lg shadow-md h-48" />
      </div>
    )
  }

  if (!profile || profile.user_type !== 'tutor') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Stripe Payouts</h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-4">
            To receive payouts, you must connect your account with Stripe.
          </p>
          {stripeConnected === true ? (
            <div className="text-green-700 bg-green-50 border border-green-200 rounded px-4 py-2 mb-2">
              <span className="font-semibold">Stripe account connected!</span> You are ready to receive payouts.
            </div>
          ) : (
            <>
              <button
                onClick={handleStripeOnboard}
                className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                disabled={stripeLoading}
              >
                {stripeLoading ? 'Connecting...' : 'Connect with Stripe'}
              </button>
              {stripeError && <p className="text-red-600 mt-2">{stripeError}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 
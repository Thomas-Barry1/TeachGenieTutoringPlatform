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

type StripeStatus = {
  connected: boolean
  accountId?: string
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  requirements?: any
  error?: string
}

type PendingPayment = {
  id: string
  session_id: string
  amount: number
  tutor_payout: number
  created_at: string
}

export default function TutorPayments() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [retryLoading, setRetryLoading] = useState(false)

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
        .then(data => setStripeStatus(data))
        .catch(() => setStripeStatus({ connected: false, error: 'Failed to check status' }))
    }
  }, [profile])

  useEffect(() => {
    if (stripeStatus?.connected && user) {
      loadPendingPayments()
    }
  }, [stripeStatus, user])

  const loadPendingPayments = async () => {
    setPendingLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('session_payments')
        .select(`
          id,
          session_id,
          amount,
          tutor_payout,
          created_at,
          sessions!inner(
            tutor_id
          )
        `)
        .eq('sessions.tutor_id', user?.id)
        .eq('status', 'completed')
        .is('stripe_transfer_id', null)

      if (error) {
        console.error('Error loading pending payments:', error)
      } else {
        setPendingPayments(data || [])
      }
    } catch (error) {
      console.error('Error loading pending payments:', error)
    } finally {
      setPendingLoading(false)
    }
  }

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

  const handleRetryPendingPayments = async () => {
    if (!user) return
    
    setRetryLoading(true)
    try {
      const res = await fetch('/api/stripe/retry-pending-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tutorId: user.id })
      })

      const data = await res.json()
      
      if (res.ok) {
        // Reload pending payments after successful retry
        await loadPendingPayments()
        alert(`Successfully processed ${data.successfulCount} payments. Total amount: $${data.totalAmountTransferred}`)
      } else {
        alert('Failed to retry payments: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      alert('Failed to retry payments: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setRetryLoading(false)
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

  const totalPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.tutor_payout, 0)

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Stripe Payouts</h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-4">
            To receive payouts, you must connect your account with Stripe.
          </p>
          
          {stripeStatus?.connected ? (
            <div className="space-y-4">
              <div className="text-green-700 bg-green-50 border border-green-200 rounded px-4 py-2">
                <span className="font-semibold">Stripe account connected!</span> You are ready to receive payouts.
              </div>
              
              {/* Pending Payments Section */}
              {pendingLoading ? (
                <div className="text-sm text-gray-600">Loading pending payments...</div>
              ) : pendingPayments.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-800">
                      {pendingPayments.length} pending payment{pendingPayments.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-blue-700 font-medium">
                      ${totalPendingAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    These payments are ready to be transferred to your Stripe account.
                  </p>
                  <button
                    onClick={handleRetryPendingPayments}
                    disabled={retryLoading}
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {retryLoading ? 'Processing...' : 'Transfer Pending Payments'}
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No pending payments found.
                </div>
              )}
            </div>
          ) : stripeStatus?.accountId ? (
            <div className="space-y-2">
              <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-4 py-2">
                <span className="font-semibold">Onboarding in progress</span>
                <div className="text-sm mt-1">
                  {!stripeStatus.chargesEnabled && <div>• Payment processing not enabled</div>}
                  {!stripeStatus.payoutsEnabled && <div>• Payouts not enabled</div>}
                </div>
              </div>
              <button
                onClick={handleStripeOnboard}
                className="px-4 py-2 text-white bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50"
                disabled={stripeLoading}
              >
                {stripeLoading ? 'Loading...' : 'Complete Onboarding'}
              </button>
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
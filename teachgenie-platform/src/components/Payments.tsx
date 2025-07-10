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

type CompletedPayment = {
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
  const [completedPayments, setCompletedPayments] = useState<CompletedPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

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

  const checkStripeStatus = async () => {
    try {
      const res = await fetch('/api/stripe/tutor-status')
      const data = await res.json()
      setStripeStatus(data)
    } catch (error) {
      setStripeStatus({ connected: false, error: 'Failed to check status' })
    }
  }

  useEffect(() => {
    if (profile && profile.user_type === 'tutor') {
      checkStripeStatus()
    }
  }, [profile])

  useEffect(() => {
    if (stripeStatus?.connected && user) {
      loadCompletedPayments()
    }
  }, [stripeStatus, user])

  const loadCompletedPayments = async () => {
    setPaymentsLoading(true)
    try {
      const supabase = createClient()
      console.log('Loading completed payments for user:', user?.id)
      
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

      if (error) {
        console.error('Error loading completed payments:', error)
      } else {
        console.log('Found completed payments:', data)
        setCompletedPayments(data || [])
      }
    } catch (error) {
      console.error('Error loading completed payments:', error)
    } finally {
      setPaymentsLoading(false)
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

  const handleOpenDashboard = () => {
    // Open a new tab pointing to our Stripe dashboard page
    window.open('/stripe-dashboard', '_blank')
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

  const totalCompletedAmount = completedPayments.reduce((sum: number, payment: CompletedPayment) => sum + payment.tutor_payout, 0)

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
              
              {/* Stripe Dashboard Link */}
              <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-blue-800">Stripe Express Dashboard</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      View your payments, manage your account, and check your payout schedule.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenDashboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Open Dashboard
                  </button>
                </div>
              </div>
              
              {/* Payment History Section */}
              {paymentsLoading ? (
                <div className="text-sm text-gray-600">Loading payment history...</div>
              ) : completedPayments.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-800">
                      {completedPayments.length} completed payment{completedPayments.length !== 1 ? 's' : ''} ready for payout
                    </span>
                    <span className="text-blue-700 font-medium">
                      ${totalCompletedAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    These payments have been automatically transferred to your Stripe account and will be paid out according to your payout schedule.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No completed payments found.
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
                <div className="text-sm mt-2 text-yellow-800">
                  You may need to complete additional verification steps in your Stripe dashboard. 
                  Click &quot;Complete Onboarding&quot; to access your Stripe account.
                </div>
              </div>
              
              {/* Stripe Dashboard Link for Incomplete Accounts */}
              <div className="bg-yellow-50 border border-yellow-200 rounded px-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-yellow-800">Stripe Express Dashboard</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Complete your account setup and manage your payment settings.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenDashboard}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    Open Dashboard
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleStripeOnboard}
                  className="px-4 py-2 text-white bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50"
                  disabled={stripeLoading}
                >
                  {stripeLoading ? 'Loading...' : 'Complete Onboarding'}
                </button>
                <button
                  onClick={async () => {
                    setRefreshing(true)
                    await checkStripeStatus()
                    setRefreshing(false)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                  disabled={refreshing}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Status'}
                </button>
              </div>
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
'use client'

import { useState, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import stripePromise from '@/lib/stripe/client'
import PaymentForm from './PaymentForm'
import { useAuth } from '@/contexts/AuthContext'

interface PaymentWrapperProps {
  sessionId: string
  amount: number
  tutorName: string
  tutorId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaymentWrapper({ sessionId, amount, tutorName, tutorId, onSuccess, onError }: PaymentWrapperProps) {
  const { user } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function createPaymentIntent() {
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            amount,
            tutorId, // Use the actual tutor ID from the session
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create payment intent')
        }

        const { clientSecret: secret } = await response.json()
        setClientSecret(secret)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create payment intent'
        setError(errorMessage)
        onError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [sessionId, amount, tutorId, user, onError])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Preparing payment...</div>
      </div>
    )
  }

  if (error || !clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-red-600">{error || 'Failed to initialize payment'}</div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        sessionId={sessionId}
        amount={amount}
        tutorName={tutorName}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
} 
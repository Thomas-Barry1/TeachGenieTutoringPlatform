'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'

interface PaymentFormProps {
  sessionId: string
  amount: number
  tutorName: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaymentForm({ sessionId, amount, tutorName, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Confirm payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      })

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed')
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const platformFee = (amount * 15) / 100
  const tutorPayout = amount - platformFee

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
      
      <div className="mb-6 space-y-2">
        <div className="flex justify-between">
          <span>Session with {tutorName}</span>
          <span>${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Platform fee (15%)</span>
          <span>${platformFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tutor receives</span>
          <span>${tutorPayout.toFixed(2)}</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${amount.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <PaymentElement />
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </form>
    </div>
  )
} 
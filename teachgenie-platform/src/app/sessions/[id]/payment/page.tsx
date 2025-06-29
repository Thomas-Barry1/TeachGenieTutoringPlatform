'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import PaymentWrapper from '@/components/PaymentWrapper'

interface Session {
  id: string
  tutor_id: string
  student_id: string
  subject_id: string
  start_time: string
  end_time: string
  status: string
  price: number
  payment_status: string
  tutor: {
    profiles: {
      first_name: string
      last_name: string
    }
  }
  subject: {
    name: string
  }
}

export default function SessionPaymentPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      if (!id || !user) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor:tutor_profiles(
            profiles(first_name, last_name)
          ),
          subject:subjects(name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        setError('Session not found')
        setLoading(false)
        return
      }

      // Check if user is the student for this session
      if (data.student_id !== user.id) {
        setError('Unauthorized')
        setLoading(false)
        return
      }

      // Check if payment is already completed
      if (data.payment_status === 'paid') {
        setError('Payment already completed')
        setLoading(false)
        return
      }

      setSession(data)
      setLoading(false)
    }

    loadSession()
  }, [id, user])

  const handlePaymentSuccess = () => {
    router.push('/dashboard?payment=success')
  }

  const handlePaymentError = (error: string) => {
    setError(error)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Loading session...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-red-600">{error || 'Session not found'}</div>
      </div>
    )
  }

  const tutorName = `${session.tutor.profiles.first_name} ${session.tutor.profiles.last_name}`
  const sessionDuration = (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 60) // hours

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Complete Payment</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Session Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tutor:</span>
              <span>{tutorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subject:</span>
              <span>{session.subject.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{new Date(session.start_time).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span>
                {new Date(session.start_time).toLocaleTimeString()} - {new Date(session.end_time).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span>{sessionDuration} hour{sessionDuration !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">${session.price}</span>
            </div>
          </div>
        </div>
      </div>

      <PaymentWrapper
        sessionId={session.id}
        amount={session.price}
        tutorName={tutorName}
        tutorId={session.tutor_id}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  )
} 
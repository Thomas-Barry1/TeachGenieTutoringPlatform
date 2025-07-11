'use client'

import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Session = Database['public']['Tables']['sessions']['Row'] & {
  tutor?: {
    profile: Database['public']['Tables']['profiles']['Row']
  }
  student?: {
    profile: Database['public']['Tables']['profiles']['Row']
  }
  subject: Database['public']['Tables']['subjects']['Row']
}

type Review = Database['public']['Tables']['reviews']['Row']

interface SessionCardProps {
  session: Session
  userType: 'student' | 'tutor'
  onStatusChange?: (sessionId: string, newStatus: Session['status']) => Promise<void>
  onDelete?: (sessionId: string) => Promise<void>
}

export default function SessionCard({ session, userType, onStatusChange, onDelete }: SessionCardProps) {
  const startTime = new Date(session.start_time)
  const endTime = new Date(session.end_time)
  const otherParty = userType === 'student' ? session.tutor?.profile : session.student?.profile
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  const [loadingReview, setLoadingReview] = useState(false)
  console.log("SessionCard", session)
  console.log("otherParty", otherParty)

  // Check for existing review when component mounts
  useEffect(() => {
    async function checkExistingReview() {
      if (userType === 'student' && session.status === 'completed') {
        setLoadingReview(true)
        const supabase = createClient()
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase
              .from('reviews')
              .select('*')
              .eq('session_id', session.id)
              .eq('student_id', user.id)
              .single()
            
            setExistingReview(data)
          }
        } catch (error) {
          // Review doesn't exist or other error
          setExistingReview(null)
        } finally {
          setLoadingReview(false)
        }
      }
    }

    checkExistingReview()
  }, [session.id, session.status, userType])

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async () => {
    if (onDelete && confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      await onDelete(session.id)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">
              {otherParty?.first_name} {otherParty?.last_name}
            </h3>
            <p className="text-gray-600">{session.subject.name}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                session.status
              )}`}
            >
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
            {session.payment_status && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                  session.payment_status
                )}`}
              >
                {session.payment_status.charAt(0).toUpperCase() + session.payment_status.slice(1)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center text-gray-600">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {format(startTime, 'MMMM d, yyyy')}
          </div>
          <div className="flex items-center text-gray-600">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </div>
          <div className="flex items-center text-gray-600">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            ${session.price}
          </div>
        </div>

        {/* Payment button for students with unpaid sessions */}
        {userType === 'student' && session.payment_status === 'pending' && session.status != 'cancelled' && (
          <div className="mt-6">
            <a
              href={`/sessions/${session.id}/payment`}
              className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Pay Now (${session.price})
            </a>
          </div>
        )}

        {session.status === 'scheduled' && onStatusChange && (
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => onStatusChange(session.id, 'completed')}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Complete
            </button>
            <button
              onClick={() => onStatusChange(session.id, 'cancelled')}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {session.status === 'completed' && userType === 'student' && (
          <div className="mt-6">
            {loadingReview ? (
              <div className="block w-full text-center px-4 py-2 bg-gray-400 text-white rounded-lg">
                Loading...
              </div>
            ) : existingReview ? (
                             <a
                 href={`/reviews/?sessionId=${session.id}`}
                 className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 Edit Review
               </a>
            ) : (
              <a
                href={`/reviews/?sessionId=${session.id}`}
                className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Write a Review
              </a>
            )}
          </div>
        )}

        {/* Delete button for tutors on cancelled or completed sessions */}
        {userType === 'tutor' && (session.status === 'cancelled' || session.status === 'completed') && onDelete && (
          <div className="mt-6">
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Delete Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 
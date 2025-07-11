'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Session = Database['public']['Tables']['sessions']['Row'] & {
  tutor: {
    profile: Database['public']['Tables']['profiles']['Row']
  }
  subject: Database['public']['Tables']['subjects']['Row']
}

type Review = Database['public']['Tables']['reviews']['Row']

function ReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const [session, setSession] = useState<Session | null>(null)
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    async function loadSessionAndReview() {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to write a review')
        setLoading(false)
        return
      }

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor:tutor_id (
            profile:profiles (*)
          ),
          subject:subject_id (*)
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        setError('Failed to load session')
        setLoading(false)
        return
      }

      if (!sessionData) {
        setError('Session not found')
        setLoading(false)
        return
      }

      if (sessionData.status !== 'completed') {
        setError('Can only review completed sessions')
        setLoading(false)
        return
      }

      // Check if user is the student for this session
      if (sessionData.student_id !== user.id) {
        setError('You can only review sessions you participated in')
        setLoading(false)
        return
      }

      setSession(sessionData)

      // Check for existing review
      const { data: existingReviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('student_id', user.id)
        .single()

      if (existingReviewData) {
        setExistingReview(existingReviewData)
        setRating(existingReviewData.rating)
        setComment(existingReviewData.comment || '')
        setIsEditing(true)
      }

      setLoading(false)
    }

    loadSessionAndReview()
  }, [sessionId])

  const canEdit = () => {
    return existingReview !== null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setSubmitting(true)
    const supabase = createClient()

    try {
      if (isEditing && existingReview) {
        // Update existing review

        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReview.id)

        if (error) {
          setError('Failed to update review')
          setSubmitting(false)
          return
        }
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            session_id: session.id,
            student_id: session.student_id,
            tutor_id: session.tutor_id,
            rating,
            comment
          })

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            setError('You have already reviewed this session')
          } else {
            setError('Failed to submit review')
          }
          setSubmitting(false)
          return
        }
      }

      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-red-800 hover:text-red-900"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Review' : 'Write a Review'}
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Session with {session.tutor.profile.first_name} {session.tutor.profile.last_name}
            </h2>
            <p className="text-gray-600">{session.subject.name}</p>
            {isEditing && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  You can edit your review at any time to provide updated feedback.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`p-2 rounded-full ${
                      rating >= value ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <svg
                      className="h-8 w-8"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Review
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Share your experience with this tutor..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : (isEditing ? 'Update Review' : 'Submit Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ReviewPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewPage />
    </Suspense>
  )
} 
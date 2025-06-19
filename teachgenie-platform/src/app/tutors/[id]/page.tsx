'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  avatar_url: string | null
}

type Tutor = Database['public']['Tables']['tutor_profiles']['Row'] & {
  profile: Profile
  subjects: Database['public']['Tables']['subjects']['Row'][]
  reviews: (Database['public']['Tables']['reviews']['Row'] & {
    student: Profile
  })[]
}

export default function TutorProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [bookingError, setBookingError] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('tutor_profiles')
      .select(`
        *,
        profile:profiles(*),
        subjects:tutor_subjects(
          subject:subjects(*)
        ),
        reviews:reviews(
          *,
          student:profiles(*)
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching tutor:', error)
          return
        }

        // Transform the data to match our Tutor type
        const transformedTutor = {
          ...data,
          subjects: data.subjects.map((s: any) => s.subject),
          reviews: data.reviews.map((r: any) => ({
            ...r,
            student: r.student
          }))
        }

        setTutor(transformedTutor)
        setLoading(false)
      })
  }, [id])

  const handleBooking = async () => {
    if (!user) {
      setBookingError('Please sign in to book a session')
      return
    }

    if (!selectedDate || !selectedTime || !selectedSubject) {
      setBookingError('Please fill in all required fields')
      return
    }

    const supabase = createClient()
    const startTime = new Date(`${selectedDate}T${selectedTime}`)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour session

    const { error } = await supabase
      .from('sessions')
      .insert({
        tutor_id: id,
        student_id: user.id,
        subject_id: selectedSubject,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        price: tutor?.hourly_rate || 0
      })

    if (error) {
      setBookingError('Failed to book session. Please try again.')
      return
    }

    // Redirect to dashboard or show success message
    window.location.href = '/dashboard'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Tutor not found</h3>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Tutor Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start space-x-6">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200">
            {tutor.profile.avatar_url ? (
              <img
                src={tutor.profile.avatar_url}
                alt={`${tutor.profile.first_name} ${tutor.profile.last_name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {tutor.profile.first_name} {tutor.profile.last_name}
            </h1>
            <p className="text-gray-600 mt-1">
              {tutor.hourly_rate ? `$${tutor.hourly_rate}/hour` : 'Rate not set'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tutor.subjects.map(subject => (
                <span
                  key={subject.id}
                  className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                >
                  {subject.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        {tutor.bio && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{tutor.bio}</p>
          </div>
        )}
      </div>

      {/* Messaging Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Contact Tutor</h2>
        <p className="text-gray-600 mb-4">
          Send a message to {tutor.profile.first_name} to discuss your tutoring needs.
        </p>
        <a
          href={`/inbox?recipient=${tutor.id}`}
          className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Send Message
        </a>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Reviews</h2>
        {tutor.reviews.length > 0 ? (
          <div className="space-y-6">
            {tutor.reviews.map(review => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                    {review.student && review.student.avatar_url ? (
                      <img
                        src={review.student.avatar_url}
                        alt={`${review.student.first_name} ${review.student.last_name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        ?
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {review.student 
                        ? `${review.student.first_name} ${review.student.last_name}`
                        : 'Student (private)'
                      }
                    </h3>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-4 text-gray-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet</p>
        )}
      </div>
    </div>
  )
} 
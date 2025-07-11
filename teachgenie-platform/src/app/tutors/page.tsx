'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  avatar_url: string | null
}

type Tutor = Database['public']['Tables']['tutor_profiles']['Row'] & {
  profile: Profile | null
  subjects: Database['public']['Tables']['subjects']['Row'][]
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [subjects, setSubjects] = useState<Database['public']['Tables']['subjects']['Row'][]>([])
  const [reviewsSummary, setReviewsSummary] = useState<Record<string, { avg: number, count: number }>>({})

  useEffect(() => {
    const supabase = createClient()

    // Fetch subjects
    supabase
      .from('subjects')
      .select('*')
      .order('name')
      .then(({ data: subjectsData, error: subjectsError }) => {
        if (subjectsError) {
          console.error('Error fetching subjects:', subjectsError)
          setError('Failed to load subjects')
          return
        }
        if (subjectsData) {
          setSubjects(subjectsData)
        }
      })

    // Fetch verified tutors with their profiles and subjects
    supabase
      .from('tutor_profiles')
      .select(`
        *,
        profile:profiles(*),
        subjects:tutor_subjects(
          subject:subjects(*)
        )
      `)
      .eq('is_verified', true)
      .then(async ({ data: tutorsData, error: tutorsError }) => {
        if (tutorsError) {
          console.error('Error fetching tutors:', tutorsError)
          setError('Failed to load tutors')
          return
        }

        if (!tutorsData) {
          setTutors([])
          setLoading(false)
          return
        }

        // Transform the data to match our Tutor type
        const transformedTutors = tutorsData
          .filter(tutor => tutor.profile !== null) // Filter out tutors without profiles
          .map(tutor => ({
            ...tutor,
            subjects: tutor.subjects?.map((s: any) => s.subject) || []
          }))
        setTutors(transformedTutors)
        // Fetch review summary for each tutor (including external reviews)
        const summaries: Record<string, { avg: number, count: number }> = {}
        await Promise.all(transformedTutors.map(async (tutor) => {
          // Fetch platform reviews
          const { data: platformReviews, error: platformReviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('tutor_id', tutor.id)
          
          // Fetch external reviews
          const { data: externalReviews, error: externalReviewsError } = await supabase
            .from('external_reviews')
            .select('rating')
            .eq('tutor_id', tutor.id)
          
          if (!platformReviewsError && !externalReviewsError) {
            const allReviews = [
              ...(platformReviews || []),
              ...(externalReviews || [])
            ]
            
            if (allReviews.length > 0) {
              const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
              summaries[tutor.id] = { avg, count: allReviews.length }
            } else {
              summaries[tutor.id] = { avg: 0, count: 0 }
            }
          } else {
            summaries[tutor.id] = { avg: 0, count: 0 }
          }
        }))
        setReviewsSummary(summaries)
        setLoading(false)
      })
  }, [])

  const filteredTutors = tutors.filter(tutor => {
    if (!tutor.profile) return false

    const matchesSearch = searchQuery === '' || 
      tutor.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.bio?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSubject = selectedSubject === '' ||
      tutor.subjects.some(subject => subject.id === selectedSubject)

    return matchesSearch && matchesSubject
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600">{error}</h3>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tutors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutors.map(tutor => (
          <div
            key={tutor.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[370px] max-h-[370px]"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                  {tutor.profile?.avatar_url ? (
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
                <div>
                  <h3 className="text-lg font-semibold">
                    {tutor.profile?.first_name} {tutor.profile?.last_name}
                  </h3>
                  <p className="text-gray-600">
                    {tutor.hourly_rate ? `$${tutor.hourly_rate}/hour` : 'Rate not set'}
                  </p>
                  <div className="flex items-center mt-1">
                    {reviewsSummary[tutor.id]?.count > 0 ? (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(reviewsSummary[tutor.id].avg) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-sm text-gray-500">({reviewsSummary[tutor.id].count} review{reviewsSummary[tutor.id].count > 1 ? 's' : ''})</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">No reviews yet</span>
                    )}
                  </div>
                </div>
              </div>
              {tutor.bio && (
                <p className="mt-4 text-gray-600 line-clamp-3">{tutor.bio}</p>
              )}
              <div
                className="mt-4 flex flex-wrap gap-2 max-h-16 relative"
                title={tutor.subjects.map(s => s.name).join(', ')}
              >
                {tutor.subjects.slice(0, 6).map(subject => (
                  <span
                    key={subject.id}
                    className="px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {subject.name}
                  </span>
                ))}
                {tutor.subjects.length > 6 && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">+{tutor.subjects.length - 6} more</span>
                )}
              </div>
              <div className="mt-auto pt-6">
                <a
                  href={`/tutors/${tutor.id}`}
                  className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View Profile
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTutors.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No tutors found</h3>
          <p className="mt-2 text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
} 
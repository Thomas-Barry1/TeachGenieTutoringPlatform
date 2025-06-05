'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Tutor = Database['public']['Tables']['tutor_profiles']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'] | null
  subjects: Database['public']['Tables']['subjects']['Row'][]
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [subjects, setSubjects] = useState<Database['public']['Tables']['subjects']['Row'][]>([])

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

    // Fetch tutors with their profiles and subjects
    supabase
      .from('tutor_profiles')
      .select(`
        *,
        profile:profiles(*),
        subjects:tutor_subjects(
          subject:subjects(*)
        )
      `)
      .then(({ data: tutorsData, error: tutorsError }) => {
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
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-200" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {tutor.profile?.first_name} {tutor.profile?.last_name}
                  </h3>
                  <p className="text-gray-600">
                    {tutor.hourly_rate ? `$${tutor.hourly_rate}/hour` : 'Rate not set'}
                  </p>
                </div>
              </div>
              {tutor.bio && (
                <p className="mt-4 text-gray-600 line-clamp-3">{tutor.bio}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {tutor.subjects.map(subject => (
                  <span
                    key={subject.id}
                    className="px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {subject.name}
                  </span>
                ))}
              </div>
              <div className="mt-6">
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
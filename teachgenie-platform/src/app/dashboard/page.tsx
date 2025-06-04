'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import TutorSubjectManager from '@/components/TutorSubjectManager'

type Profile = {
  id: string
  first_name: string
  last_name: string
  user_type: 'student' | 'tutor'
  email: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        return
      }

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {profile.first_name}!
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {profile.first_name} {profile.last_name}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Account Type</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">
              {profile.user_type}
            </dd>
          </div>
        </dl>
      </div>

      {profile.user_type === 'tutor' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Tutor Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your tutoring sessions and availability here.
          </p>
          <div className="mt-6">
            <TutorSubjectManager tutorId={profile.id} />
          </div>
        </div>
      )}

      {profile.user_type === 'student' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Student Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            View your upcoming sessions and find tutors here.
          </p>
          {/* Add student-specific content here */}
        </div>
      )}
    </div>
  )
} 
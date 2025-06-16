'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import TutorSubjectManager from '@/components/TutorSubjectManager'
import SessionsPage from '@/app/sessions/page'
import ImageUpload from '@/components/Profile/ImageUpload'

type Profile = {
  id: string
  first_name: string
  last_name: string
  user_type: 'student' | 'tutor'
  email: string
  avatar_url: string | null
}

type TutorProfile = {
  id: string
  bio: string | null
  hourly_rate: number | null
  is_verified: boolean
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState('')
  const [editedRate, setEditedRate] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        console.log('No user found')
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
        return
      }

      console.log('Profile data loaded:', profileData)
      setProfile(profileData)

      if (profileData.user_type === 'tutor') {
        console.log('Loading tutor profile for:', user.id)
        const { data: tutorData, error: tutorError } = await supabase
          .from('tutor_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (tutorError) {
          console.error('Error loading tutor profile:', tutorError)
          return
        }

        console.log('Tutor profile data loaded:', tutorData)
        setTutorProfile(tutorData)
        setEditedBio(tutorData.bio || '')
        setEditedRate(tutorData.hourly_rate?.toString() || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [user])

  const handleSaveProfile = async () => {
    if (!user || !tutorProfile) return

    const supabase = createClient()
    const { error } = await supabase
      .from('tutor_profiles')
      .update({
        bio: editedBio,
        hourly_rate: parseFloat(editedRate) || null
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating tutor profile:', error)
      return
    }

    setTutorProfile({
      ...tutorProfile,
      bio: editedBio,
      hourly_rate: parseFloat(editedRate) || null
    })
    setIsEditing(false)
  }

  if (loading) {
    console.log('Loading state:', loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    console.log('No profile found')
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Profile not found</div>
      </div>
    )
  }

  console.log('Rendering dashboard with profile:', profile)
  console.log('Tutor profile:', tutorProfile)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {profile.first_name}!
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Edit Profile
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <dl className="mt-4 space-y-6">
          {/* Profile Image Section */}
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-2">Profile Image</dt>
            <dd className="mt-1">
              <div className="flex items-start space-x-6">
                {/* Current Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                
                {/* Upload Component - Only shown in edit mode */}
                {isEditing && (
                  <div className="flex-1">
                    <ImageUpload
                      userId={profile.id}
                      onUploadComplete={(url) => {
                        setProfile({ ...profile, avatar_url: url });
                      }}
                    />
                  </div>
                )}
              </div>
            </dd>
          </div>

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

      {profile.user_type === 'tutor' && tutorProfile && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Tutor Profile</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedBio(tutorProfile.bio || '')
                    setEditedRate(tutorProfile.hourly_rate?.toString() || '')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Verification Status</dt>
              <dd className="mt-1">
                {tutorProfile.is_verified ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending Verification
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Bio</dt>
              {isEditing ? (
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  rows={4}
                  placeholder="Tell students about yourself..."
                />
              ) : (
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {tutorProfile.bio || 'No bio provided'}
                </dd>
              )}
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
              {isEditing ? (
                <div className="mt-1">
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={editedRate}
                      onChange={(e) => setEditedRate(e.target.value)}
                      className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">/hr</span>
                    </div>
                  </div>
                </div>
              ) : (
                <dd className="mt-1 text-sm text-gray-900">
                  {tutorProfile.hourly_rate ? `$${tutorProfile.hourly_rate}/hr` : 'Not set'}
                </dd>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Add Sessions section for both user types */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">My Sessions</h2>
        <SessionsPage />
      </div>
    </div>
  )
} 
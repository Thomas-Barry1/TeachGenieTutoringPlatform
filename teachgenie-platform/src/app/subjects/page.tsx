"use client"

import { useAuth } from '@/contexts/AuthContext'
import TutorSubjectManager from '@/components/TutorSubjectManager'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SubjectsPage() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (!error) setProfile(data)
    }
    loadProfile()
  }, [user])

  useEffect(() => {
    async function loadSubjects() {
      setSubjectsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })
      if (!error) setSubjects(data || [])
      setSubjectsLoading(false)
    }
    loadSubjects()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>
  }
  if (!user) {
    return <div className="flex items-center justify-center min-h-[60vh]">You must be logged in to view subjects.</div>
  }
  if (!profile) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading profile...</div>
  }

  if (profile.user_type === 'tutor') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-4">Manage Your Subjects</h1>
        <TutorSubjectManager tutorId={profile.id} />
      </div>
    )
  }

  // Student view: read-only subject list
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Available Subjects</h1>
      {subjectsLoading ? (
        <div>Loading subjects...</div>
      ) : (
        <div className="space-y-2">
          {subjects.length === 0 ? (
            <div>No subjects found.</div>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="font-medium">{subject.name}</span>
                <span className="ml-2 text-sm text-gray-500">({subject.category})</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
} 
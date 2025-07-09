'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import SessionCard from '@/components/sessions/SessionCard'
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

export default function SessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')
  const [userType, setUserType] = useState<'student' | 'tutor'>('student')

  console.log('SessionsPage mounted')
  console.log('Current user:', user)

  useEffect(() => {
    console.log('useEffect triggered')
    console.log('User in effect:', user)

    if (!user) {
      console.log('No user found, returning early')
      return
    }

    const fetchSessions = async () => {
      console.log('Starting fetchSessions')
      try {
        const supabase = createClient()
        console.log('Current user ID:', user.id)

        // First, let's check if there are any sessions at all
        const { count, error: countError } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })

        if (countError) {
          console.error('Session count error:', countError)
        } else {
          console.log('Total sessions in database:', count)
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          throw profileError
        }

        if (!profile) {
          console.error('No profile found for user:', user.id)
          throw new Error('Profile not found')
        }

        console.log('User profile:', profile)
        setUserType(profile.user_type)

        const now = new Date().toISOString()
        console.log('Current time:', now)

        const query = supabase
          .from('sessions')
          .select(`
            *,
            tutor:tutor_id (
              *,
              profile:profiles (*)
            ),
            student:student_id (*),
            subject:subject_id (*)
          `)
          .or(`tutor_id.eq.${user.id},student_id.eq.${user.id}`)
          .order('start_time', { ascending: filter === 'upcoming' })

        if (filter === 'upcoming') {
          query.gte('start_time', now)
        } else {
          query.lt('start_time', now)
        }

        console.log('Query filter:', filter)

        const { data, error } = await query

        if (error) {
          console.error('Session fetch error:', error)
          throw error
        }
        
        console.log('Raw session data:', data)
        
        // Transform the data to match the expected Session type structure
        const transformedSessions = (data || []).map((session: any) => ({
          ...session,
          // For student, create a nested profile structure to match tutor
          student: {
            profile: session.student
          }
        }))
        
        console.log('Transformed session data:', transformedSessions)
        setSessions(transformedSessions)
      } catch (err) {
        console.error('Session fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [user, filter])

  const handleStatusChange = async (sessionId: string, newStatus: Session['status']) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', sessionId)

      if (error) throw error

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, status: newStatus } : session
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session status')
    }
  }

  const handleDelete = async (sessionId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md h-48" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'upcoming'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'past'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">
              {filter === 'upcoming'
                ? "You don't have any upcoming sessions"
                : "You don't have any past sessions"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                userType={userType}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import SessionCard from '@/components/sessions/SessionCard'
import SessionFilters from '@/components/sessions/SessionFilters'
import SessionPagination from '@/components/sessions/SessionPagination'
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

type FilterType = 'upcoming' | 'past' | 'all'
type StatusFilter = 'all' | 'scheduled' | 'completed' | 'cancelled'
type PaymentFilter = 'all' | 'paid' | 'pending' | 'failed'

export default function SessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userType, setUserType] = useState<'student' | 'tutor'>('student')
  
  // Filter states
  const [filter, setFilter] = useState<FilterType>('upcoming')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [sessionsPerPage] = useState(12)
  
  // Available subjects for filtering
  const [availableSubjects, setAvailableSubjects] = useState<Array<{id: string, name: string}>>([])

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

        // Fetch all sessions for the user (we'll filter client-side for better UX)
        const { data, error } = await supabase
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
          .order('start_time', { ascending: false })

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

        // Extract unique subjects for filtering
        const subjects = Array.from(
          new Set(
            transformedSessions
              .map(session => session.subject)
              .filter(Boolean)
              .map(subject => JSON.stringify({ id: subject.id, name: subject.name }))
          )
        ).map(subjectStr => JSON.parse(subjectStr))
        
        setAvailableSubjects(subjects)
      } catch (err) {
        console.error('Session fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [user])

  // Filter and search sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions

    // Time-based filtering
    const now = new Date()
    if (filter === 'upcoming') {
      filtered = filtered.filter(session => new Date(session.start_time) > now)
    } else if (filter === 'past') {
      filtered = filtered.filter(session => new Date(session.start_time) <= now)
    }

    // Status filtering
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    // Payment status filtering
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(session => session.payment_status === paymentFilter)
    }

    // Subject filtering
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(session => session.subject.id === subjectFilter)
    }

    // Search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(session => {
        const tutorName = `${session.tutor?.profile?.first_name || ''} ${session.tutor?.profile?.last_name || ''}`.toLowerCase()
        const studentName = `${session.student?.profile?.first_name || ''} ${session.student?.profile?.last_name || ''}`.toLowerCase()
        const subjectName = session.subject.name.toLowerCase()
        
        return tutorName.includes(query) || 
               studentName.includes(query) || 
               subjectName.includes(query)
      })
    }

    return filtered
  }, [sessions, filter, statusFilter, paymentFilter, subjectFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage)
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage
  )

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, statusFilter, paymentFilter, subjectFilter, searchQuery])

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

  const clearFilters = () => {
    setFilter('upcoming')
    setStatusFilter('all')
    setPaymentFilter('all')
    setSubjectFilter('all')
    setSearchQuery('')
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
        </div>

        {/* Filters */}
        <SessionFilters
          filter={filter}
          setFilter={setFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          subjectFilter={subjectFilter}
          setSubjectFilter={setSubjectFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          availableSubjects={availableSubjects}
          filteredCount={filteredSessions.length}
          totalCount={sessions.length}
          onClearFilters={clearFilters}
        />

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || subjectFilter !== 'all'
                ? "No sessions match your current filters"
                : "You don't have any sessions"}
            </p>
            {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || subjectFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="mt-2 text-primary-600 hover:text-primary-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  userType={userType}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            <SessionPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSessions.length}
              itemsPerPage={sessionsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  )
} 
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type Profile = Tables['profiles']['Row']
type TutorProfile = Tables['tutor_profiles']['Row']
type Subject = Tables['subjects']['Row']
type Session = Tables['sessions']['Row']
type Review = Tables['reviews']['Row']

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function getTutorProfile(userId: string): Promise<TutorProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching tutor profile:', error)
    return null
  }

  return data
}

export async function getTutorSubjects(tutorId: string): Promise<Subject[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tutor_subjects')
    .select(`
      subjects:subject_id (
        id,
        name,
        category,
        created_at
      )
    `)
    .eq('tutor_id', tutorId)

  if (error) {
    console.error('Error fetching tutor subjects:', error)
    return []
  }

  return data
    .map(item => item.subjects)
    .flat()
    .filter((subject): subject is Subject => 
      subject !== null && 
      typeof subject.id === 'string' &&
      typeof subject.name === 'string' &&
      typeof subject.category === 'string' &&
      typeof subject.created_at === 'string'
    )
}

export async function getTutorSessions(tutorId: string): Promise<Session[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching tutor sessions:', error)
    return []
  }

  return data
}

export async function getStudentSessions(studentId: string): Promise<Session[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching student sessions:', error)
    return []
  }

  return data
}

export async function getTutorReviews(tutorId: string): Promise<Review[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (
        first_name,
        last_name
      )
    `)
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tutor reviews:', error)
    return []
  }

  return data
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

export async function updateTutorProfile(
  userId: string,
  updates: Partial<Omit<TutorProfile, 'id'>>
): Promise<TutorProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tutor_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating tutor profile:', error)
    return null
  }

  return data
}

export async function createSession(
  session: Omit<Session, 'id' | 'created_at'>
): Promise<Session | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single()

  if (error) {
    console.error('Error creating session:', error)
    return null
  }

  return data
}

export async function createReview(
  review: Omit<Review, 'id' | 'created_at'>
): Promise<Review | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single()

  if (error) {
    console.error('Error creating review:', error)
    return null
  }

  return data
} 
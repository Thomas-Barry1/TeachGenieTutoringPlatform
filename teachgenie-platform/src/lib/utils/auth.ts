import { createClient } from '@/lib/supabase/client'

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signUp(email: string, password: string, userData: {
  firstName: string
  lastName: string
  userType: 'student' | 'tutor'
}) {
  const supabase = createClient()
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (authError) throw authError

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user?.id,
      first_name: userData.firstName,
      last_name: userData.lastName,
      user_type: userData.userType,
      email,
    })
  if (profileError) throw profileError

  // If user is a tutor, create tutor profile
  if (userData.userType === 'tutor') {
    const { error: tutorError } = await supabase
      .from('tutor_profiles')
      .insert({
        id: authData.user?.id,
        is_verified: false,
      })
    if (tutorError) throw tutorError
  }

  return authData
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
} 
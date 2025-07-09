import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import stripe from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a tutor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'tutor') {
      return NextResponse.json({ error: 'Only tutors can access Stripe dashboard' }, { status: 403 })
    }

    // Get tutor's Stripe account ID
    const { data: tutorProfile, error: tutorError } = await supabase
      .from('tutor_profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (tutorError || !tutorProfile) {
      return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
    }

    if (!tutorProfile.stripe_account_id) {
      return NextResponse.json({ error: 'Tutor not onboarded to Stripe' }, { status: 400 })
    }

    // Create login link for the Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(tutorProfile.stripe_account_id)

    return NextResponse.json({
      url: loginLink.url
    })

  } catch (error) {
    console.error('Create login link error:', error)
    return NextResponse.json(
      { error: 'Failed to create login link' },
      { status: 500 }
    )
  }
} 
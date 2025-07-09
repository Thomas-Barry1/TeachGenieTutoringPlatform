import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import stripe from '@/lib/stripe/server'

const PLATFORM_FEE_PERCENTAGE = 15

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { sessionId, amount, tutorId } = await request.json()
    
    if (!sessionId || !amount || !tutorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate session exists and user has access
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if user is the student for this session
    if (session.student_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get tutor's Stripe account ID
    const { data: tutorProfile, error: tutorError } = await supabase
      .from('tutor_profiles')
      .select('stripe_account_id')
      .eq('id', tutorId)
      .single()

    if (tutorError || !tutorProfile) {
      return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
    }

    if (!tutorProfile.stripe_account_id) {
      return NextResponse.json({ error: 'Tutor not onboarded to Stripe' }, { status: 400 })
    }

    // Calculate fees
    const platformFee = Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100 * 100) // Convert to cents
    const tutorPayout = Math.round(amount * 100) - platformFee

    // Create payment intent with destination charge (marketplace flow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      application_fee_amount: platformFee, // Platform fee
      transfer_data: {
        destination: tutorProfile.stripe_account_id, // Tutor's connected account
      },
      metadata: {
        sessionId,
        tutorId,
        platformFee: (platformFee / 100).toString(), // Store in dollars for readability
        tutorPayout: (tutorPayout / 100).toString(), // Store in dollars for readability
        studentId: user.id
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store payment record in database using regular client (RLS policies handle security)
    const { error: dbError } = await supabase
      .from('session_payments')
      .insert({
        session_id: sessionId,
        amount,
        platform_fee: platformFee / 100, // Convert back to dollars for storage
        tutor_payout: tutorPayout / 100, // Convert back to dollars for storage
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Payment intent was created but database insert failed
      // In production, you might want to cancel the payment intent here
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
} 
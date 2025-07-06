import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import stripe from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('Stripe webhook received')
  
  // Check if required environment variables are set
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET environment variable is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('No Stripe signature found in headers')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    console.log('Webhook event verified:', event.type)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    console.log('Processing webhook event:', event.type)
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object, supabase)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object, supabase)
        break

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object, supabase)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    console.log('Webhook processed successfully')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }

  async function handlePaymentSuccess(paymentIntent: any, supabase: any) {
    console.log('Processing payment success for:', paymentIntent.id)
    console.log('Payment metadata:', paymentIntent.metadata)
    
    const { sessionId, tutorId, platformFee, tutorPayout, studentId } = paymentIntent.metadata

    if (!sessionId) {
      console.error('No sessionId found in payment metadata')
      throw new Error('Missing sessionId in payment metadata')
    }

    console.log('sessionId from Stripe:', sessionId, typeof sessionId);

    // Validate session exists before updating
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, payment_status')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      console.error('Error fetching session:', sessionError)
      throw new Error(`Failed to fetch session: ${sessionError.message}`)
    }

    if (!session) {
      console.error(`Session ${sessionId} not found for payment ${paymentIntent.id}`)
      throw new Error(`Session ${sessionId} not found`)
    }

    console.log('Found session:', session)

    // Get tutor's Stripe account ID
    const { data: tutorProfile, error: tutorError } = await supabase
      .from('tutor_profiles')
      .select('stripe_account_id')
      .eq('id', tutorId)
      .single()

    if (tutorError || !tutorProfile) {
      console.error('Error fetching tutor profile:', tutorError)
      throw new Error(`Failed to fetch tutor profile: ${tutorError?.message}`)
    }

    if (!tutorProfile.stripe_account_id) {
      console.error(`Tutor ${tutorId} does not have a Stripe account`)
      throw new Error('Tutor not onboarded to Stripe')
    }

    // Create transfer to tutor's Stripe account
    let transferId = null
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(parseFloat(tutorPayout) * 100), // Convert to cents
        currency: 'usd',
        destination: tutorProfile.stripe_account_id,
        transfer_group: sessionId,
        metadata: {
          sessionId,
          tutorId,
          platformFee,
          tutorPayout,
          studentId
        }
      })
      
      transferId = transfer.id
      console.log(`Transfer created successfully: ${transfer.id}`)
    } catch (transferError) {
      console.error('Error creating transfer:', transferError)
      // Don't throw here - we still want to update the payment status
      // The transfer can be retried manually if needed
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from('session_payments')
      .update({
        status: 'completed',
        stripe_transfer_id: transferId
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (paymentError) {
      console.error('Error updating payment record:', paymentError)
      throw new Error(`Failed to update payment record: ${paymentError.message}`)
    }

    console.log('Payment record updated successfully')

    // Update session payment status
    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update({ payment_status: 'paid' })
      .eq('id', sessionId)

    if (sessionUpdateError) {
      console.error('Error updating session payment status:', sessionUpdateError)
      throw new Error(`Failed to update session payment status: ${sessionUpdateError.message}`)
    }

    console.log(`Payment successful for session ${sessionId}. Tutor payout: $${tutorPayout}`)
  }

  async function handlePaymentFailure(paymentIntent: any, supabase: any) {
    const { sessionId } = paymentIntent.metadata

    // Validate session exists before updating
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error(`Session ${sessionId} not found for failed payment ${paymentIntent.id}`)
      return
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from('session_payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (paymentError) {
      console.error('Error updating payment record:', paymentError)
    }

    // Update session payment status
    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update({ payment_status: 'failed' })
      .eq('id', sessionId)

    if (sessionUpdateError) {
      console.error('Error updating session payment status:', sessionUpdateError)
    }

    console.log(`Payment failed for session ${sessionId}`)
  }

  async function handlePaymentCanceled(paymentIntent: any, supabase: any) {
    const { sessionId } = paymentIntent.metadata

    // Validate session exists before updating
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error(`Session ${sessionId} not found for canceled payment ${paymentIntent.id}`)
      return
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from('session_payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (paymentError) {
      console.error('Error updating payment record:', paymentError)
    }

    // Update session payment status
    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update({ payment_status: 'failed' })
      .eq('id', sessionId)

    if (sessionUpdateError) {
      console.error('Error updating session payment status:', sessionUpdateError)
    }

    console.log(`Payment canceled for session ${sessionId}`)
  }

  async function handleAccountUpdated(account: any, supabase: any) {
    console.log('Processing account update for:', account.id)
    
    // Check if this is a connected account that just became fully enabled
    if (account.charges_enabled && account.payouts_enabled) {
      console.log('Account is now fully enabled, checking for pending payments')
      
      // Find the tutor associated with this Stripe account
      const { data: tutorProfile, error: tutorError } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('stripe_account_id', account.id)
        .single()

      if (tutorError || !tutorProfile) {
        console.log('No tutor found for Stripe account:', account.id)
        return
      }

      console.log('Found tutor for account update:', tutorProfile.id)

      // Trigger retry of pending payments for this tutor
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/retry-pending-payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Key': process.env.INTERNAL_API_KEY || 'internal'
          },
          body: JSON.stringify({ tutorId: tutorProfile.id })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Pending payments retry triggered:', result)
        } else {
          console.error('Failed to trigger pending payments retry:', response.status)
        }
      } catch (error) {
        console.error('Error triggering pending payments retry:', error)
      }
    }
  }
} 
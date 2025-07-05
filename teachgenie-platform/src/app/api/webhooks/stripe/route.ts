import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import stripe from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

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

  const supabase = await createClient()

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

    // Update payment record
    const { error: paymentError } = await supabase
      .from('session_payments')
      .update({
        status: 'completed',
        stripe_transfer_id: paymentIntent.id
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
} 
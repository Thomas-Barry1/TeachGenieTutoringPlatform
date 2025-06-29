import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import stripe from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object)
        break

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  async function handlePaymentSuccess(paymentIntent: any) {
    const { sessionId, tutorId, platformFee, tutorPayout, studentId } = paymentIntent.metadata

    // Validate session exists before updating
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, payment_status')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error(`Session ${sessionId} not found for payment ${paymentIntent.id}`)
      return
    }

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
    }

    // Update session payment status
    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update({ payment_status: 'paid' })
      .eq('id', sessionId)

    if (sessionUpdateError) {
      console.error('Error updating session payment status:', sessionUpdateError)
    }

    console.log(`Payment successful for session ${sessionId}. Tutor payout: $${tutorPayout}`)
  }

  async function handlePaymentFailure(paymentIntent: any) {
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

  async function handlePaymentCanceled(paymentIntent: any) {
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
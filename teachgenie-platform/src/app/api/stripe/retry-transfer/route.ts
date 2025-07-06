import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import stripe from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionPaymentId } = await request.json()
    
    if (!sessionPaymentId) {
      return NextResponse.json({ error: 'Missing sessionPaymentId' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient()

    // Get the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('session_payments')
      .select(`
        *,
        sessions!inner(
          tutor_id,
          payment_status
        )
      `)
      .eq('id', sessionPaymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    if (payment.status === 'completed' && payment.stripe_transfer_id) {
      return NextResponse.json({ error: 'Transfer already completed' }, { status: 400 })
    }

    // Get tutor's Stripe account ID
    const { data: tutorProfile, error: tutorError } = await supabase
      .from('tutor_profiles')
      .select('stripe_account_id')
      .eq('id', payment.sessions.tutor_id)
      .single()

    if (tutorError || !tutorProfile || !tutorProfile.stripe_account_id) {
      return NextResponse.json({ error: 'Tutor not onboarded to Stripe' }, { status: 400 })
    }

    // Create transfer to tutor's Stripe account
    const transfer = await stripe.transfers.create({
      amount: Math.round(payment.tutor_payout * 100), // Convert to cents
      currency: 'usd',
      destination: tutorProfile.stripe_account_id,
      transfer_group: payment.session_id,
      metadata: {
        sessionId: payment.session_id,
        tutorId: payment.sessions.tutor_id,
        platformFee: payment.platform_fee.toString(),
        tutorPayout: payment.tutor_payout.toString(),
        retry: 'true'
      }
    })

    // Update payment record with transfer ID
    const { error: updateError } = await supabase
      .from('session_payments')
      .update({
        status: 'completed',
        stripe_transfer_id: transfer.id
      })
      .eq('id', sessionPaymentId)

    if (updateError) {
      console.error('Error updating payment record:', updateError)
      return NextResponse.json({ error: 'Failed to update payment record' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      transferId: transfer.id,
      amount: payment.tutor_payout
    })

  } catch (error) {
    console.error('Retry transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to retry transfer' },
      { status: 500 }
    )
  }
} 
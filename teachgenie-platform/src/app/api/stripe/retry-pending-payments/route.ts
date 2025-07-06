import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import stripe from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow internal calls
    const internalKey = request.headers.get('X-Internal-Key')
    if (internalKey !== (process.env.INTERNAL_API_KEY || 'internal')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tutorId } = await request.json()
    
    if (!tutorId) {
      return NextResponse.json({ error: 'Missing tutorId' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient()

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

    // Get all completed payments for this tutor that haven't been transferred yet
    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('session_payments')
      .select(`
        *,
        sessions!inner(
          tutor_id,
          status,
          end_time
        )
      `)
      .eq('sessions.tutor_id', tutorId)
      .eq('status', 'completed')
      .is('stripe_transfer_id', null)

    if (paymentsError) {
      console.error('Error fetching pending payments:', paymentsError)
      return NextResponse.json({ error: 'Failed to fetch pending payments' }, { status: 500 })
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({ 
        message: 'No pending payments found for this tutor',
        tutorId,
        pendingCount: 0
      })
    }

    const results = []

    for (const payment of pendingPayments) {
      try {
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
            retry: 'true',
            retryReason: 'tutor_onboarded'
          }
        })

        // Update payment record with transfer ID
        const { error: updateError } = await supabase
          .from('session_payments')
          .update({
            stripe_transfer_id: transfer.id
          })
          .eq('id', payment.id)

        if (updateError) {
          console.error('Error updating payment record:', updateError)
          results.push({
            paymentId: payment.id,
            sessionId: payment.session_id,
            success: false,
            error: 'Failed to update payment record'
          })
        } else {
          results.push({
            paymentId: payment.id,
            sessionId: payment.session_id,
            success: true,
            transferId: transfer.id,
            amount: payment.tutor_payout
          })
        }

      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error)
        results.push({
          paymentId: payment.id,
          sessionId: payment.session_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalAmount = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    return NextResponse.json({
      message: `Processed ${results.length} pending payments for tutor ${tutorId}: ${successful} successful, ${failed} failed`,
      tutorId,
      pendingCount: pendingPayments.length,
      successfulCount: successful,
      failedCount: failed,
      totalAmountTransferred: totalAmount,
      results
    })

  } catch (error) {
    console.error('Retry pending payments error:', error)
    return NextResponse.json(
      { error: 'Failed to retry pending payments' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tutor profile with Stripe account ID
    const { data: tutorProfile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (profileError || !tutorProfile) {
      return NextResponse.json({ connected: false, error: 'Tutor profile not found' });
    }

    if (!tutorProfile.stripe_account_id) {
      return NextResponse.json({ connected: false });
    }

    // Check Stripe account status
    try {
      const account = await stripe.accounts.retrieve(tutorProfile.stripe_account_id);
      
      // Check if account is fully onboarded
      const isComplete = account.charges_enabled && account.payouts_enabled;
      
      // If account just became complete, trigger pending payment retry
      if (isComplete) {
        try {
          // Trigger retry of pending payments in the background
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/retry-pending-payments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Add a secret header to prevent external calls
              'X-Internal-Key': process.env.INTERNAL_API_KEY || 'internal'
            },
            body: JSON.stringify({ tutorId: user.id })
          }).catch(error => {
            console.error('Background retry failed:', error);
            // Don't fail the main request if background retry fails
          });
        } catch (retryError) {
          console.error('Error triggering pending payment retry:', retryError);
          // Don't fail the main request if retry fails
        }
      }
      
      return NextResponse.json({ 
        connected: isComplete,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements
      });
    } catch (stripeError) {
      console.error('Stripe account retrieval error:', stripeError);
      return NextResponse.json({ connected: false, error: 'Stripe account not found' });
    }

  } catch (error) {
    console.error('Tutor status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check tutor status' },
      { status: 500 }
    );
  }
} 
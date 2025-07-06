import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a tutor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'tutor') {
      return NextResponse.json({ error: 'Only tutors can onboard to Stripe' }, { status: 403 });
    }

    // Check if tutor already has a Stripe account
    const { data: tutorProfile, error: tutorError } = await supabase
      .from('tutor_profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (tutorError) {
      return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
    }

    if (tutorProfile.stripe_account_id) {
      return NextResponse.json({ error: 'Tutor already has a Stripe account' }, { status: 400 });
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: profile.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'weekly',
            weekly_anchor: 'monday', // Payouts every Monday
            delay_days: 7, // 7-day delay
          },
        },
      },
    });

    // Store the Stripe account ID in the database
    const { error: updateError } = await supabase
      .from('tutor_profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating tutor profile:', updateError);
      // Clean up the Stripe account if database update fails
      await stripe.accounts.del(account.id);
      return NextResponse.json({ error: 'Failed to save Stripe account' }, { status: 500 });
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });

  } catch (error) {
    console.error('Stripe onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe onboarding link' },
      { status: 500 }
    );
  }
} 
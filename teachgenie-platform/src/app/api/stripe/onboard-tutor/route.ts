import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id)
    console.log('User email:', user.email)

    // Verify user is a tutor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('Profile error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('Profile data:', profile)

    if (profile.user_type !== 'tutor') {
      console.log('User is not a tutor:', profile.user_type)
      return NextResponse.json({ error: 'Only tutors can onboard to Stripe' }, { status: 403 });
    }

    console.log('User is a tutor, checking existing Stripe account...')

    // Check if tutor already has a Stripe account
    const { data: tutorProfile, error: tutorError } = await supabase
      .from('tutor_profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (tutorError) {
      console.log('Tutor profile error:', tutorError)
      return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
    }

    console.log('Tutor profile found, stripe_account_id:', tutorProfile.stripe_account_id)

    // If tutor already has a Stripe account, check if it's fully onboarded
    if (tutorProfile.stripe_account_id) {
      try {
        const existingAccount = await stripe.accounts.retrieve(tutorProfile.stripe_account_id);
        const isComplete = existingAccount.charges_enabled && existingAccount.payouts_enabled;
        
        if (isComplete) {
          console.log('Tutor already has a complete Stripe account')
          return NextResponse.json({ error: 'Tutor already has a complete Stripe account' }, { status: 400 });
        } else {
          console.log('Tutor has incomplete Stripe account, creating new onboarding link')
          // Create new onboarding link for existing account
          const accountLink = await stripe.accountLinks.create({
            account: tutorProfile.stripe_account_id,
            refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments?refresh=true`,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments?success=true`,
            type: 'account_onboarding',
          });
          
          return NextResponse.json({ url: accountLink.url });
        }
      } catch (stripeError) {
        console.log('Error checking existing Stripe account:', stripeError)
        // If the account doesn't exist or is invalid, we can create a new one
        console.log('Creating new Stripe account...')
      }
    }

    console.log('Creating new Stripe Connect Express account...')
    console.log('Account creation data:', {
      email: profile.email,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      business_type: 'individual'
    })

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: profile.email,
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        mcc: '8299',
        product_description: 'I am a tutor',
      },
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

    console.log('Stripe account created:', account.id)

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

    console.log('Tutor profile updated with Stripe account ID')

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments?success=true`,
      type: 'account_onboarding',
    });

    console.log('Onboarding link created successfully')

    return NextResponse.json({ url: accountLink.url });

  } catch (error) {
    console.error('Stripe onboarding error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    return NextResponse.json(
      { error: 'Failed to create Stripe onboarding link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is a tutor
  const { data: profile, error: profileError } = await supabase
    .from('tutor_profiles')
    .select('id, stripe_account_id')
    .eq('id', user.id)
    .single();
  if (profileError || !profile) {
    return NextResponse.json({ error: 'Not a tutor' }, { status: 403 });
  }

  let stripeAccountId = profile.stripe_account_id;

  // If no Stripe account, create one
  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email!,
    });
    stripeAccountId = account.id;
    // Save to DB
    await supabase
      .from('tutor_profiles')
      .update({ stripe_account_id: stripeAccountId })
      .eq('id', user.id);
  }

  // Create onboarding link
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/dashboard?stripe=refresh`,
    return_url: `${origin}/dashboard?stripe=return`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
} 
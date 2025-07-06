import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function GET(request: NextRequest) {
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
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();
  if (profileError || !profile) {
    return NextResponse.json({ error: 'Not a tutor' }, { status: 403 });
  }

  const stripeAccountId = profile.stripe_account_id;
  if (!stripeAccountId) {
    return NextResponse.json({ connected: false });
  }

  // Fetch Stripe account status
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const connected = !!(account.charges_enabled && account.payouts_enabled);
    return NextResponse.json({ connected });
  } catch (err) {
    return NextResponse.json({ connected: false });
  }
} 
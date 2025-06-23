import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '../../../lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Authenticate user using Supabase Auth session
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });
  }

  const { to, subject, html } = await req.json();
  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const data = await resend.emails.send({
      from: 'noreply@teachgenie.io',
      to,
      subject,
      html,
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
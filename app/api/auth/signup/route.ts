import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export async function POST(request: Request) {
  const meta = withRequestMeta(request, 'auth.signup');
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return validationError('Email and password required', 'Send both email and password in the JSON body.', meta, {
        missing: [!email && 'email', !password && 'password'].filter(Boolean),
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Default display name was 'Commander', the same sci-fi cosplay
        // PR #163 retired from the dashboard h1. New users now get
        // their email's local part as a default display name (e.g.
        // jane.doe@x.com -> jane.doe), or 'Friend' if no email is set.
        data: { display_name: name || (email && typeof email === 'string' ? email.split('@')[0] : 'Friend') },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, requestId: meta.requestId, timestamp: meta.startedAt },
        { status: 400, headers: meta.headers },
      );
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    }, { headers: meta.headers });
  } catch (err) {
    return errorResponse(err, meta);
  }
}

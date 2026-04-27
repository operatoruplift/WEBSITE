import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export async function POST(request: Request) {
  const meta = withRequestMeta(request, 'auth.login');
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return validationError('Email and password required', 'Send both email and password in the JSON body.', meta, {
        missing: [!email && 'email', !password && 'password'].filter(Boolean),
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { error: error.message, requestId: meta.requestId, timestamp: meta.startedAt },
        { status: 401, headers: meta.headers },
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

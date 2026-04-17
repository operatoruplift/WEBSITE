import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, AuthError } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * GET  /api/profile/briefing       → { enabled: boolean }
 * PUT  /api/profile/briefing       → body: { enabled: boolean }
 *
 * Backs the "Daily briefing at 8am" toggle in Profile. Writes to
 * `users.briefing_enabled`. Must be authenticated.
 */
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

async function requireUser(request: Request) {
    try {
        const user = await verifySession(request);
        return { user, error: null as NextResponse | null };
    } catch (err) {
        if (err instanceof AuthError) {
            return { user: null, error: NextResponse.json({ error: err.message }, { status: 401 }) };
        }
        return { user: null, error: NextResponse.json({ error: 'auth_failed' }, { status: 401 }) };
    }
}

export async function GET(request: Request) {
    const { user, error } = await requireUser(request);
    if (error) return error;
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });

    const { data } = await supabase
        .from('users')
        .select('briefing_enabled')
        .eq('user_id', user!.userId)
        .maybeSingle();
    return NextResponse.json({ enabled: Boolean(data?.briefing_enabled) });
}

export async function PUT(request: Request) {
    const { user, error } = await requireUser(request);
    if (error) return error;
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });

    const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };
    const enabled = Boolean(body.enabled);

    const { error: upsertErr } = await supabase
        .from('users')
        .upsert(
            { user_id: user!.userId, briefing_enabled: enabled, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' },
        );
    if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }
    return NextResponse.json({ enabled });
}

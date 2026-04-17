import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, AuthError } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * GET    /api/notifications/pinned        → { pinned: [...] }
 *   Returns rows whose pinned_until > now(). Used by /chat to render
 *   the daily briefing as a pinned system message at the top of the
 *   thread.
 *
 * DELETE /api/notifications/pinned?id=... → dismiss a specific row
 *   (sets read_at = now()). Still leaves it in the table for audit.
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
    if (!supabase) return NextResponse.json({ pinned: [] });

    const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, pinned_until, read_at, created_at')
        .eq('user_id', user!.userId)
        .gt('pinned_until', new Date().toISOString())
        .is('read_at', null)
        .order('pinned_until', { ascending: true })
        .limit(10);

    return NextResponse.json({ pinned: data ?? [] });
}

export async function DELETE(request: Request) {
    const { user, error } = await requireUser(request);
    if (error) return error;
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: true });

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user!.userId)
        .eq('id', id);

    return NextResponse.json({ ok: true });
}

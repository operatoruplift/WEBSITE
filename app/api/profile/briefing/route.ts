import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, AuthError } from '@/lib/auth';
import { withRequestMeta, errorResponse, type RequestMeta } from '@/lib/apiHelpers';

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

async function requireUser(request: Request, meta: RequestMeta) {
    try {
        const user = await verifySession(request);
        return { user, error: null as NextResponse | null };
    } catch (err) {
        const message = err instanceof AuthError ? err.message : 'auth_failed';
        return {
            user: null,
            error: NextResponse.json(
                { error: message, requestId: meta.requestId, timestamp: meta.startedAt },
                { status: 401, headers: meta.headers },
            ),
        };
    }
}

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'profile.briefing.get');
    const { user, error } = await requireUser(request, meta);
    if (error) return error;
    const supabase = getSupabase();
    if (!supabase) {
        return errorResponse(new Error('supabase_not_configured'), meta, {
            errorClass: 'provider_unavailable',
        });
    }

    const { data } = await supabase
        .from('users')
        .select('briefing_enabled')
        .eq('user_id', user!.userId)
        .maybeSingle();
    return NextResponse.json({ enabled: Boolean(data?.briefing_enabled) }, { headers: meta.headers });
}

export async function PUT(request: Request) {
    const meta = withRequestMeta(request, 'profile.briefing.put');
    const { user, error } = await requireUser(request, meta);
    if (error) return error;
    const supabase = getSupabase();
    if (!supabase) {
        return errorResponse(new Error('supabase_not_configured'), meta, {
            errorClass: 'provider_unavailable',
        });
    }

    const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };
    const enabled = Boolean(body.enabled);

    const { error: upsertErr } = await supabase
        .from('users')
        .upsert(
            { user_id: user!.userId, briefing_enabled: enabled, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' },
        );
    if (upsertErr) {
        return errorResponse(new Error(upsertErr.message), meta);
    }
    return NextResponse.json({ enabled }, { headers: meta.headers });
}

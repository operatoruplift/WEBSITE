import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCapabilities } from '@/lib/capabilities';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/tools/notes
 * Body: { action: 'create' | 'list', params: { title?: string; body?: string; limit?: number } }
 *
 * Tier 1 tool. Real = Supabase `notes` table scoped to user via RLS.
 * Demo callers run executeMock client-side, so they never hit this
 * route. The capability guard here is belt-and-braces.
 */
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'tools.notes');
    try {
        const caps = await getCapabilities(request);
        if (!caps.capability_real || !caps.userId) {
            return NextResponse.json(
                { error: 'demo_mode', simulated: true, message: 'Sign in to save real notes.', requestId: meta.requestId },
                { status: 403, headers: meta.headers },
            );
        }
        const supabase = getSupabase();
        if (!supabase) {
            return errorResponse(new Error('supabase_not_configured'), meta, { errorClass: 'provider_unavailable' });
        }

        const { action, params } = (await request.json()) as {
            action?: string;
            params?: { title?: string; body?: string; limit?: number };
        };

        if (action === 'create') {
            const title = String(params?.title ?? '').slice(0, 200);
            const body = String(params?.body ?? '').slice(0, 20000);
            if (!body) {
                return validationError('body required', 'Send params.body in the JSON payload.', meta, { missing: ['body'] });
            }
            const { data, error } = await supabase
                .from('notes')
                .insert({ user_id: caps.userId, title: title || body.slice(0, 80), body })
                .select('id, title, body, created_at')
                .single();
            if (error) return errorResponse(new Error(error.message), meta);
            return NextResponse.json({ action, note: data }, { headers: meta.headers });
        }

        if (action === 'list') {
            const limit = Math.max(1, Math.min(50, Number(params?.limit ?? 20)));
            const { data, error } = await supabase
                .from('notes')
                .select('id, title, body, created_at')
                .eq('user_id', caps.userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) return errorResponse(new Error(error.message), meta);
            return NextResponse.json({ action, notes: data ?? [] }, { headers: meta.headers });
        }

        return validationError(`unknown_action:${action}`, 'Use action="create" or action="list".', meta, { action });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

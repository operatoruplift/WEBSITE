import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCapabilities } from '@/lib/capabilities';

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
    const caps = await getCapabilities(request);
    if (!caps.capability_real || !caps.userId) {
        return NextResponse.json(
            { error: 'demo_mode', simulated: true, message: 'Sign in to save real notes.' },
            { status: 403 },
        );
    }
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });
    }

    const { action, params } = (await request.json()) as {
        action?: string;
        params?: { title?: string; body?: string; limit?: number };
    };

    if (action === 'create') {
        const title = String(params?.title ?? '').slice(0, 200);
        const body = String(params?.body ?? '').slice(0, 20000);
        if (!body) return NextResponse.json({ error: 'body required' }, { status: 400 });
        const { data, error } = await supabase
            .from('notes')
            .insert({ user_id: caps.userId, title: title || body.slice(0, 80), body })
            .select('id, title, body, created_at')
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action, note: data });
    }

    if (action === 'list') {
        const limit = Math.max(1, Math.min(50, Number(params?.limit ?? 20)));
        const { data, error } = await supabase
            .from('notes')
            .select('id, title, body, created_at')
            .eq('user_id', caps.userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action, notes: data ?? [] });
    }

    return NextResponse.json({ error: `unknown_action:${action}` }, { status: 400 });
}

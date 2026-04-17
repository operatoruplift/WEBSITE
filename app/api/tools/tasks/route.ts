import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCapabilities } from '@/lib/capabilities';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/tools/tasks
 * Body: { action: 'create' | 'list' | 'complete', params: { title?: string; due?: string; id?: string; limit?: number } }
 *
 * Tier 1 tool. Real = Supabase `tasks` table, user-scoped.
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
            { error: 'demo_mode', simulated: true, message: 'Sign in to save real tasks.' },
            { status: 403 },
        );
    }
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });
    }

    const { action, params } = (await request.json()) as {
        action?: string;
        params?: { title?: string; due?: string; id?: string; limit?: number };
    };

    if (action === 'create') {
        const title = String(params?.title ?? '').slice(0, 200);
        if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
        const due = params?.due ? new Date(String(params.due)).toISOString() : null;
        const { data, error } = await supabase
            .from('tasks')
            .insert({ user_id: caps.userId, title, due, status: 'pending' })
            .select('id, title, due, status, created_at')
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action, task: data });
    }

    if (action === 'list') {
        const limit = Math.max(1, Math.min(100, Number(params?.limit ?? 20)));
        const { data, error } = await supabase
            .from('tasks')
            .select('id, title, due, status, created_at')
            .eq('user_id', caps.userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action, tasks: data ?? [] });
    }

    if (action === 'complete') {
        const id = String(params?.id ?? '').trim();
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const { data, error } = await supabase
            .from('tasks')
            .update({ status: 'done', updated_at: new Date().toISOString() })
            .eq('user_id', caps.userId)
            .eq('id', id)
            .select('id, title, status')
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action, task: data });
    }

    return NextResponse.json({ error: `unknown_action:${action}` }, { status: 400 });
}

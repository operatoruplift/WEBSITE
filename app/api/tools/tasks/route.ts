import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCapabilities } from '@/lib/capabilities';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

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
    const meta = withRequestMeta(request, 'tools.tasks');
    try {
        const caps = await getCapabilities(request);
        if (!caps.capability_real || !caps.userId) {
            return NextResponse.json(
                { error: 'demo_mode', simulated: true, message: 'Sign in to save real tasks.', requestId: meta.requestId },
                { status: 403, headers: meta.headers },
            );
        }
        const supabase = getSupabase();
        if (!supabase) {
            return errorResponse(new Error('supabase_not_configured'), meta, { errorClass: 'provider_unavailable' });
        }

        const { action, params } = (await request.json()) as {
            action?: string;
            params?: { title?: string; due?: string; id?: string; limit?: number };
        };

        if (action === 'create') {
            const title = String(params?.title ?? '').slice(0, 200);
            if (!title) {
                return validationError('title required', 'Send params.title in the JSON payload.', meta, { missing: ['title'] });
            }
            const due = params?.due ? new Date(String(params.due)).toISOString() : null;
            const { data, error } = await supabase
                .from('tasks')
                .insert({ user_id: caps.userId, title, due, status: 'pending' })
                .select('id, title, due, status, created_at')
                .single();
            if (error) return errorResponse(new Error(error.message), meta);
            return NextResponse.json({ action, task: data }, { headers: meta.headers });
        }

        if (action === 'list') {
            const limit = Math.max(1, Math.min(100, Number(params?.limit ?? 20)));
            const { data, error } = await supabase
                .from('tasks')
                .select('id, title, due, status, created_at')
                .eq('user_id', caps.userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) return errorResponse(new Error(error.message), meta);
            return NextResponse.json({ action, tasks: data ?? [] }, { headers: meta.headers });
        }

        if (action === 'complete') {
            const id = String(params?.id ?? '').trim();
            if (!id) {
                return validationError('id required', 'Send params.id in the JSON payload.', meta, { missing: ['id'] });
            }
            const { data, error } = await supabase
                .from('tasks')
                .update({ status: 'done', updated_at: new Date().toISOString() })
                .eq('user_id', caps.userId)
                .eq('id', id)
                .select('id, title, status')
                .single();
            if (error) return errorResponse(new Error(error.message), meta);
            return NextResponse.json({ action, task: data }, { headers: meta.headers });
        }

        return validationError(`unknown_action:${action}`, 'Use action="create", "list", or "complete".', meta, { action });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

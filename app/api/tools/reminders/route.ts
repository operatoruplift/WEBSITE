import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCapabilities } from '@/lib/capabilities';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/tools/reminders
 * Body: { action: 'schedule' | 'list' | 'cancel', params: { kind?: string; time?: string; id?: string } }
 *
 * Tier 1 tool used for the Demo Day "reminders vibe" beat (iMessage-style
 * nudges: weather, calendar summary, horoscope). Real = Supabase
 * `notifications` table with kind + pinned_until + user_id.
 *
 * kind: 'weather' | 'calendar_summary' | 'horoscope' | 'custom'
 * time: 24h local HH:mm (scheduled for tomorrow at that time)
 */
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

function tomorrowAt(hhmm: string): Date | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) return null;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    return d;
}

export async function POST(request: Request) {
    const caps = await getCapabilities(request);
    if (!caps.capability_real || !caps.userId) {
        return NextResponse.json(
            { error: 'demo_mode', simulated: true, message: 'Sign in to schedule real nudges.' },
            { status: 403 },
        );
    }
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });

    const { action, params } = (await request.json()) as {
        action?: string;
        params?: { kind?: string; time?: string; id?: string; body?: string };
    };

    if (action === 'schedule') {
        const kind = String(params?.kind ?? 'custom');
        const scheduledFor = params?.time ? tomorrowAt(String(params.time)) : tomorrowAt('08:00');
        if (!scheduledFor) return NextResponse.json({ error: 'invalid_time' }, { status: 400 });
        const body = params?.body ? String(params.body) : `${kind} nudge for tomorrow morning`;
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: caps.userId,
                type: `reminder:${kind}`,
                body,
                pinned_until: scheduledFor.toISOString(),
            })
            .select('id, type, body, pinned_until, created_at')
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action, reminder: data });
    }

    if (action === 'list') {
        const { data, error } = await supabase
            .from('notifications')
            .select('id, type, body, pinned_until, created_at')
            .eq('user_id', caps.userId)
            .like('type', 'reminder:%')
            .order('pinned_until', { ascending: true })
            .limit(50);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action, reminders: data ?? [] });
    }

    if (action === 'cancel') {
        const id = String(params?.id ?? '').trim();
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', caps.userId)
            .eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action, cancelled: id });
    }

    return NextResponse.json({ error: `unknown_action:${action}` }, { status: 400 });
}

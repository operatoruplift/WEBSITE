import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCapabilities } from '@/lib/capabilities';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

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
    const meta = withRequestMeta(request, 'tools.reminders');
    try {
        const caps = await getCapabilities(request);
        if (!caps.capability_real || !caps.userId) {
            return NextResponse.json(
                { error: 'demo_mode', simulated: true, message: 'Sign in to schedule real nudges.', requestId: meta.requestId },
                { status: 403, headers: meta.headers },
            );
        }
        const supabase = getSupabase();
        if (!supabase) {
            return errorResponse(new Error('supabase_not_configured'), meta, { errorClass: 'provider_unavailable' });
        }

        const { action, params } = (await request.json()) as {
            action?: string;
            params?: { kind?: string; time?: string; id?: string; body?: string };
        };

        if (action === 'schedule') {
            const kind = String(params?.kind ?? 'custom');
            const scheduledFor = params?.time ? tomorrowAt(String(params.time)) : tomorrowAt('08:00');
            if (!scheduledFor) {
                return validationError('invalid_time', 'Pass params.time as 24h HH:mm (e.g. "08:00").', meta, { time: params?.time });
            }
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
            if (error) return errorResponse(new Error(error.message), meta);
            return NextResponse.json({ action, reminder: data }, { headers: meta.headers });
        }

        if (action === 'list') {
            const { data, error } = await supabase
                .from('notifications')
                .select('id, type, body, pinned_until, created_at')
                .eq('user_id', caps.userId)
                .like('type', 'reminder:%')
                .order('pinned_until', { ascending: true })
                .limit(50);
            if (error) return errorResponse(new Error(error.message), meta);
            return NextResponse.json({ action, reminders: data ?? [] }, { headers: meta.headers });
        }

        if (action === 'cancel') {
            const id = String(params?.id ?? '').trim();
            if (!id) {
                return validationError('id required', 'Send params.id in the JSON payload.', meta, { missing: ['id'] });
            }
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', caps.userId)
                .eq('id', id);
            if (error) return errorResponse(new Error(error.message), meta);
            return NextResponse.json({ action, cancelled: id }, { headers: meta.headers });
        }

        return validationError(`unknown_action:${action}`, 'Use action="schedule", "list", or "cancel".', meta, { action });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

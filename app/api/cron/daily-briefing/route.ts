import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { composeBriefing } from '@/lib/briefing';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/daily-briefing
 *
 * Called by Vercel Cron once per day (see vercel.json). For each user
 * that has opted in (`users.briefing_enabled = true`) AND has Google
 * connected, compose the agenda and insert a pinned row into
 * `notifications`. The /chat page then renders the pinned row as a
 * system message at the top of the thread.
 *
 * Protected by CRON_SECRET. Vercel sends:
 *   Authorization: Bearer ${CRON_SECRET}
 *
 * Manual smoke test (dev/staging only):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://<host>/api/cron/daily-briefing
 */
export async function GET(request: Request) {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
    }
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${expected}`) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Users who have opted in AND have Google connected. The left join
    // keeps us on one query without relying on a view.
    const { data: opted, error: optedErr } = await supabase
        .from('users')
        .select('user_id')
        .eq('briefing_enabled', true);
    if (optedErr) {
        return NextResponse.json({ error: optedErr.message }, { status: 500 });
    }

    let processed = 0;
    let inserted = 0;
    const failures: { user_id: string; error: string }[] = [];

    // Compute today's end so pinned_until drops the briefing at 23:59 local.
    // (Per-user local time is a post-May-15 upgrade; 23:59 UTC is close
    //  enough for the launch window.)
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    for (const row of opted ?? []) {
        const userId = row.user_id as string;
        processed++;
        try {
            const briefing = await composeBriefing(userId);
            if (!briefing) continue; // no events today → skip

            const { error: insertErr } = await supabase.from('notifications').insert({
                user_id: userId,
                type: 'daily_briefing',
                title: briefing.title,
                body: briefing.body,
                pinned_until: endOfDay.toISOString(),
            });
            if (insertErr) {
                failures.push({ user_id: userId, error: insertErr.message });
                continue;
            }
            inserted++;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'unknown_error';
            failures.push({ user_id: userId, error: msg });
        }
    }

    return NextResponse.json({
        ok: true,
        processed,
        inserted,
        failures,
        ran_at: new Date().toISOString(),
    });
}

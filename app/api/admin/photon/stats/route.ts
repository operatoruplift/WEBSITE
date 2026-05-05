import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getUserEmail } from '@/lib/auth';
import { isEmailBypassed, isUserIdBypassed } from '@/lib/subscription';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * GET /api/admin/photon/stats
 *
 * Admin-gated rollup of iMessage agent traffic. Counts inbound rows
 * and replies in 24h / 7d windows, plus per-platform breakdowns,
 * so the operator can answer "is the bot healthy?" with one curl
 * instead of paging through /api/admin/photon/recent.
 *
 * Auth: same gate as /api/admin/photon/recent.
 *
 * Response (200):
 *   {
 *     requestId, timestamp,
 *     last24h: { received, replied, pending, rate },
 *     last7d:  { received, replied, pending, rate },
 *     byPlatform24h: [ { platform, received, replied }, ... ],
 *   }
 *
 * `rate` is replied / received as a number in [0, 1], rounded to 2
 * decimals; null if received is 0.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'admin.photon.stats');

    try {
        const debugKey = request.headers.get('x-debug-key');
        const adminKey = process.env.DEBUG_ADMIN_KEY;

        let sessionEmail: string | null = null;
        let privyUserId: string | null = null;
        try {
            const verified = await verifySession(request);
            privyUserId = verified.userId;
            sessionEmail = await getUserEmail(verified.userId);
        } catch { /* anonymous + missing X-Debug-Key still falls through to 403 */ }

        const isAdmin =
            (!!adminKey && debugKey === adminKey)
            || (sessionEmail && isEmailBypassed(sessionEmail))
            || (privyUserId && isUserIdBypassed(privyUserId));
        if (!isAdmin) {
            return NextResponse.json(
                {
                    error: 'forbidden',
                    hint: 'Admin-gated. Bypass-listed session email OR X-Debug-Key header required.',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                },
                { status: 403, headers: meta.headers },
            );
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
            return NextResponse.json(
                {
                    error: 'supabase_not_configured',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in Vercel env.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
        const now = Date.now();
        const since24h = new Date(now - 24 * 3600 * 1000).toISOString();
        const since7d = new Date(now - 7 * 24 * 3600 * 1000).toISOString();

        const [w24Total, w24Replied, w7dTotal, w7dReplied, w24Rows] = await Promise.all([
            supabase.from('inbound_messages').select('id', { count: 'exact', head: true }).gte('received_at', since24h),
            supabase.from('inbound_messages').select('id', { count: 'exact', head: true }).gte('received_at', since24h).not('processed_at', 'is', null),
            supabase.from('inbound_messages').select('id', { count: 'exact', head: true }).gte('received_at', since7d),
            supabase.from('inbound_messages').select('id', { count: 'exact', head: true }).gte('received_at', since7d).not('processed_at', 'is', null),
            supabase.from('inbound_messages').select('platform, processed_at').gte('received_at', since24h),
        ]);

        const firstError = [w24Total, w24Replied, w7dTotal, w7dReplied, w24Rows].find(r => r.error)?.error;
        if (firstError) {
            const tableMissing = /relation .* does not exist|Could not find the table/i.test(firstError.message || '');
            return NextResponse.json(
                {
                    error: tableMissing ? 'inbound_messages_table_missing' : 'supabase_query_failed',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    detail: firstError.message?.slice(0, 240),
                    nextAction: tableMissing
                        ? 'Run lib/photon-webhook-migration.sql against your Supabase project.'
                        : 'Inspect the Supabase logs for query errors.',
                },
                { status: tableMissing ? 503 : 500, headers: meta.headers },
            );
        }

        const w24Recv = w24Total.count ?? 0;
        const w24Rep = w24Replied.count ?? 0;
        const w7Recv = w7dTotal.count ?? 0;
        const w7Rep = w7dReplied.count ?? 0;

        const platformAgg = new Map<string, { received: number; replied: number }>();
        for (const row of (w24Rows.data ?? []) as Array<{ platform: string | null; processed_at: string | null }>) {
            const key = row.platform || 'unknown';
            const slot = platformAgg.get(key) ?? { received: 0, replied: 0 };
            slot.received += 1;
            if (row.processed_at) slot.replied += 1;
            platformAgg.set(key, slot);
        }
        const byPlatform24h = Array.from(platformAgg.entries())
            .map(([platform, v]) => ({ platform, received: v.received, replied: v.replied }))
            .sort((a, b) => b.received - a.received);

        const rate = (received: number, replied: number) =>
            received === 0 ? null : Math.round((replied / received) * 100) / 100;

        safeLog({
            at: meta.route,
            event: 'stats',
            requestId: meta.requestId,
            w24Recv,
            w24Rep,
            w7Recv,
            w7Rep,
        });

        return NextResponse.json(
            {
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                last24h: {
                    received: w24Recv,
                    replied: w24Rep,
                    pending: Math.max(0, w24Recv - w24Rep),
                    rate: rate(w24Recv, w24Rep),
                },
                last7d: {
                    received: w7Recv,
                    replied: w7Rep,
                    pending: Math.max(0, w7Recv - w7Rep),
                    rate: rate(w7Recv, w7Rep),
                },
                byPlatform24h,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

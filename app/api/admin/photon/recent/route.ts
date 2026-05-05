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
 * GET /api/admin/photon/recent
 *
 * Admin-gated observability for the iMessage agent. Returns the most
 * recent N inbound_messages rows with their reply status so an
 * operator can verify the end-to-end round trip without scrolling
 * Vercel function logs.
 *
 * Auth: same gate as /api/dev/reliability/timeout — bypass-listed
 * session email, bypass-listed Privy userId, or X-Debug-Key header
 * matching DEBUG_ADMIN_KEY env var. Anything else gets 403.
 *
 * Query params:
 *   ?limit=N — clamp [1, 100], default 20
 *
 * Response (200):
 *   {
 *     requestId, timestamp,
 *     count: <returned row count>,
 *     rows: [
 *       {
 *         id, sender, platform, text, received_at,
 *         processed_at, reply_message_id, acked_at,
 *         status: 'replied' | 'pending' | 'duplicate'
 *       },
 *       ...
 *     ]
 *   }
 *
 * The body sanitizes the raw payload so internal Spectrum fields don't
 * leak. `text` is truncated to 200 chars to keep the response compact
 * and avoid surfacing long PII strings on a debug dashboard.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'admin.photon.recent');

    try {
        const debugKey = request.headers.get('x-debug-key');
        const adminKey = process.env.DEBUG_ADMIN_KEY;

        let sessionEmail: string | null = null;
        let privyUserId: string | null = null;
        try {
            const verified = await verifySession(request);
            privyUserId = verified.userId;
            sessionEmail = await getUserEmail(verified.userId);
        } catch { /* no session is fine if they bring X-Debug-Key */ }

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

        const params = new URL(request.url).searchParams;
        const rawLimit = params.get('limit');
        const parsedLimit = rawLimit ? Number(rawLimit) : NaN;
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(100, Math.max(1, Math.floor(parsedLimit)))
            : 20;

        const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
        const { data, error } = await supabase
            .from('inbound_messages')
            .select('id, sender, platform, text, received_at, processed_at, reply_message_id, acked_at, provider_message_id')
            .order('received_at', { ascending: false })
            .limit(limit);

        if (error) {
            const tableMissing = /relation .* does not exist|Could not find the table/i.test(error.message || '');
            return NextResponse.json(
                {
                    error: tableMissing ? 'inbound_messages_table_missing' : 'supabase_query_failed',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    detail: error.message?.slice(0, 240),
                    nextAction: tableMissing
                        ? 'Run lib/photon-webhook-migration.sql against your Supabase project.'
                        : 'Inspect the Supabase logs for query errors.',
                },
                { status: tableMissing ? 503 : 500, headers: meta.headers },
            );
        }

        const rows = (data ?? []).map((r) => ({
            id: r.id,
            sender: r.sender,
            platform: r.platform,
            text: typeof r.text === 'string' ? r.text.slice(0, 200) : null,
            received_at: r.received_at,
            processed_at: r.processed_at,
            reply_message_id: r.reply_message_id,
            acked_at: r.acked_at,
            status: r.processed_at ? 'replied' : 'pending',
        }));

        safeLog({ at: meta.route, event: 'rows_returned', requestId: meta.requestId, count: rows.length });

        return NextResponse.json(
            {
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                count: rows.length,
                rows,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

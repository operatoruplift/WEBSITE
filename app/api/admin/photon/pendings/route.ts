import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getUserEmail } from '@/lib/auth';
import { isEmailBypassed, isUserIdBypassed } from '@/lib/subscription';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 5;

/**
 * GET /api/admin/photon/pendings?limit=20
 *
 * Admin-gated list of the most recent imessage_pending_actions rows.
 * Useful when the operator wants to see "what's currently staged
 * for confirmation" across all senders, without paging through SQL.
 *
 * Auth: same gate as /api/admin/photon/recent (DEBUG_ADMIN_KEY in
 * x-debug-key header OR bypass-listed email/userId).
 *
 * Response (200):
 *   {
 *     requestId, timestamp,
 *     count: number,
 *     rows: Array<{
 *       sender: string,
 *       action_type: string,
 *       params: object,
 *       preview_text: string | null,
 *       expires_at: string,
 *       created_at: string,
 *       expired: boolean
 *     }>
 *   }
 *
 * Honest-status:
 *   - 403 forbidden when not admin (matches /recent shape).
 *   - 503 with the migration filename when imessage_pending_actions
 *     doesn't exist.
 *   - `params` is returned as-is (not redacted) since this is an
 *     admin-only route. Don't expose this surface to non-admins.
 */

const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

interface PendingRow {
    sender: string;
    action_type: string;
    params: Record<string, unknown>;
    preview_text: string | null;
    expires_at: string;
    created_at: string;
}

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'admin.photon.pendings');
    try {
        const debugKey = request.headers.get('x-debug-key');
        const adminKey = process.env.DEBUG_ADMIN_KEY;

        let sessionEmail: string | null = null;
        let privyUserId: string | null = null;
        try {
            const verified = await verifySession(request);
            privyUserId = verified.userId;
            sessionEmail = await getUserEmail(verified.userId);
        } catch { /* anonymous still falls through to 403 */ }

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

        const limitParam = new URL(request.url).searchParams.get('limit');
        const limit = Math.max(1, Math.min(100, Number(limitParam) || 20));

        const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
        const { data, error } = await supabase
            .from('imessage_pending_actions')
            .select('sender, action_type, params, preview_text, expires_at, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            const tableMissing = TABLE_MISSING_RE.test(error.message || '');
            return NextResponse.json(
                {
                    error: tableMissing ? 'pending_actions_table_missing' : 'supabase_query_failed',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    detail: error.message?.slice(0, 240),
                    nextAction: tableMissing
                        ? 'Run lib/photon-pending-actions-migration.sql against your Supabase project.'
                        : 'Inspect Supabase logs for query errors.',
                },
                { status: tableMissing ? 503 : 500, headers: meta.headers },
            );
        }

        const now = Date.now();
        const rows = ((data ?? []) as PendingRow[]).map(r => ({
            sender: r.sender,
            action_type: r.action_type,
            params: r.params,
            preview_text: r.preview_text,
            expires_at: r.expires_at,
            created_at: r.created_at,
            expired: new Date(r.expires_at).getTime() < now,
        }));

        safeLog({
            at: meta.route,
            event: 'pendings',
            requestId: meta.requestId,
            count: rows.length,
        });

        return NextResponse.json(
            {
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                count: rows.length,
                rows,
            },
            { status: 200, headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

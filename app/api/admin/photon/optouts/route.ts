import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getUserEmail } from '@/lib/auth';
import { isEmailBypassed, isUserIdBypassed } from '@/lib/subscription';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { clearOptOut, recordOptOut } from '@/lib/photon/opt-outs';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * Admin-gated opt-out management for the iMessage agent.
 *
 *   GET  /api/admin/photon/optouts          → list active opt-outs
 *   POST /api/admin/photon/optouts          → { sender, action: 'clear' | 'set' }
 *
 * Auth: same gate as the rest of /api/admin/photon/*.
 *
 * Lets an operator unblock a test phone number they accidentally
 * STOP'd, or pre-block a known spammer, without dropping into psql.
 *
 * Returns 503 with nextAction hints when Supabase env or the
 * imessage_opt_outs table is missing, same shape as the other admin
 * routes.
 */

interface PostBody {
    sender?: unknown;
    action?: unknown;
    reason?: unknown;
}

async function adminGate(request: Request) {
    const debugKey = request.headers.get('x-debug-key');
    const adminKey = process.env.DEBUG_ADMIN_KEY;
    let sessionEmail: string | null = null;
    let privyUserId: string | null = null;
    try {
        const verified = await verifySession(request);
        privyUserId = verified.userId;
        sessionEmail = await getUserEmail(verified.userId);
    } catch { /* anonymous still falls through to forbidden */ }
    return (
        (!!adminKey && debugKey === adminKey)
        || (sessionEmail && isEmailBypassed(sessionEmail))
        || (privyUserId && isUserIdBypassed(privyUserId))
    );
}

function forbidden(meta: ReturnType<typeof withRequestMeta>) {
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

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'admin.photon.optouts.get');
    try {
        if (!(await adminGate(request))) return forbidden(meta);

        const supabase = getSupabase();
        if (!supabase) {
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

        const { data, error } = await supabase
            .from('imessage_opt_outs')
            .select('sender, opted_out_at, last_reason, updated_at')
            .not('opted_out_at', 'is', null)
            .order('opted_out_at', { ascending: false })
            .limit(100);

        if (error) {
            const tableMissing = /relation .* does not exist|Could not find the table/i.test(error.message || '');
            return NextResponse.json(
                {
                    error: tableMissing ? 'optouts_table_missing' : 'supabase_query_failed',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    detail: error.message?.slice(0, 240),
                    nextAction: tableMissing
                        ? 'Run lib/photon-optouts-migration.sql against your Supabase project.'
                        : 'Inspect the Supabase logs for query errors.',
                },
                { status: tableMissing ? 503 : 500, headers: meta.headers },
            );
        }

        const rows = (data ?? []).map((r) => ({
            sender: r.sender,
            opted_out_at: r.opted_out_at,
            last_reason: r.last_reason,
            updated_at: r.updated_at,
        }));

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

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'admin.photon.optouts.post');
    try {
        if (!(await adminGate(request))) return forbidden(meta);

        const body = (await request.json().catch(() => null)) as PostBody | null;
        const sender = typeof body?.sender === 'string' ? body.sender.trim() : '';
        const action = typeof body?.action === 'string' ? body.action : '';
        const reason = typeof body?.reason === 'string' ? body.reason : null;
        if (!sender || (action !== 'clear' && action !== 'set')) {
            return NextResponse.json(
                {
                    error: 'invalid_body',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Send {sender, action: "clear"|"set"} in the JSON body.',
                },
                { status: 400, headers: meta.headers },
            );
        }

        const supabase = getSupabase();
        if (!supabase) {
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

        const result = action === 'clear'
            ? await clearOptOut(supabase, sender, meta.requestId)
            : await recordOptOut(supabase, sender, reason ?? 'admin', meta.requestId);

        if (!result.ok) {
            return NextResponse.json(
                {
                    error: result.tableMissing ? 'optouts_table_missing' : 'optout_write_failed',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    detail: result.error?.slice(0, 240),
                    nextAction: result.tableMissing
                        ? 'Run lib/photon-optouts-migration.sql against your Supabase project.'
                        : 'Inspect the Supabase logs for write errors.',
                },
                { status: result.tableMissing ? 503 : 500, headers: meta.headers },
            );
        }

        safeLog({
            at: meta.route,
            event: 'optout_admin_action',
            requestId: meta.requestId,
            sender,
            action,
        });

        return NextResponse.json(
            {
                ok: true,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                sender,
                action,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

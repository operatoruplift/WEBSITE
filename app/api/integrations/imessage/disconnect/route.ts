import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta } from '@/lib/apiHelpers';
import { safeWarn, safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 5;

/**
 * POST /api/integrations/imessage/disconnect
 *
 * Body: { phone?: string }   // optional E.164 phone to disconnect.
 *                           //   omit to disconnect ALL phones bound
 *                           //   to this Privy account.
 *
 * Auth: signed-in via Privy session token.
 *
 * Deletes the imessage_users row(s) so the bot stops matching inbound
 * texts to this Privy account. Existing inbound_messages and audit
 * rows stay intact (only the link is removed).
 *
 * Honest-status:
 *   - 200 with { deleted: 0 } when no row was bound (idempotent).
 *   - 401 with errorClass: reauth_required when Privy token is missing.
 *   - 503 with the migration filename when imessage_users doesn't exist.
 *   - When phone is supplied but doesn't match any row OWNED by this
 *     Privy account, returns 200 with deleted: 0 (never reveals
 *     ownership of phones bound to OTHER accounts).
 */

interface DisconnectBody {
    phone?: unknown;
}

const E164_RE = /^\+[1-9]\d{6,14}$/;
const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'integrations.imessage.disconnect');
    try {
        const verified = await verifySession(request).catch(() => null);
        if (!verified?.userId) {
            return NextResponse.json(
                {
                    error: 'unauthorized',
                    errorClass: 'reauth_required',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Sign in with Privy and retry.',
                },
                { status: 401, headers: meta.headers },
            );
        }

        const body = (await request.json().catch(() => null)) as DisconnectBody | null;
        const rawPhone = typeof body?.phone === 'string' ? body.phone.trim() : '';
        if (rawPhone && !E164_RE.test(rawPhone)) {
            return NextResponse.json(
                {
                    error: 'invalid_phone',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Send phone in E.164 format, e.g. "+15551234567", or omit phone to disconnect all.',
                },
                { status: 400, headers: meta.headers },
            );
        }

        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json(
                {
                    error: 'no_supabase',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        // Always scope by privy_user_id so a stolen / coerced phone
        // string can't drop someone else's row. Adding the optional
        // phone filter narrows further when supplied.
        let query = supabase
            .from('imessage_users')
            .delete({ count: 'exact' })
            .eq('privy_user_id', verified.userId);
        if (rawPhone) query = query.eq('sender', rawPhone);

        const { error, count } = await query;

        if (error) {
            const tableMissing = TABLE_MISSING_RE.test(error.message || '');
            if (tableMissing) {
                return NextResponse.json(
                    {
                        error: 'table_missing',
                        errorClass: 'provider_unavailable',
                        requestId: meta.requestId,
                        timestamp: meta.startedAt,
                        nextAction: 'Run lib/photon-imessage-users-migration.sql against your Supabase project.',
                    },
                    { status: 503, headers: meta.headers },
                );
            }
            safeWarn({
                at: meta.route,
                event: 'disconnect_failed',
                requestId: meta.requestId,
                error: error.message?.slice(0, 240),
            });
            return NextResponse.json(
                {
                    error: 'database_error',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Check Supabase connectivity and retry.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const deleted = typeof count === 'number' ? count : 0;
        safeLog({
            at: meta.route,
            event: 'disconnected',
            requestId: meta.requestId,
            deleted,
            scoped: rawPhone ? 'one' : 'all',
        });

        return NextResponse.json(
            {
                deleted,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 200, headers: meta.headers },
        );
    } catch (err) {
        safeWarn({
            at: meta.route,
            event: 'disconnect_unexpected',
            requestId: meta.requestId,
            error: err instanceof Error ? err.message.slice(0, 240) : String(err),
        });
        return NextResponse.json(
            {
                error: 'unexpected',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 500, headers: meta.headers },
        );
    }
}

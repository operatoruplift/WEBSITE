import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { confirmCode, type ConfirmReason } from '@/lib/photon/verify-codes';
import { upsertVerifiedUser } from '@/lib/photon/users';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * POST /api/integrations/imessage/confirm
 *
 * Body: { phone: string, code: string }
 *
 * Auth: signed-in via Privy session token. Must match the user that
 * issued the code at /start (pinned in imessage_verifications.pending_for).
 *
 * On success: upserts an imessage_users row linking the phone to
 * the signed-in Privy account, deletes the verifications row.
 *
 * Failure shapes (all return 401 to keep the leg ambiguous, with a
 * specific reason in the body so the UI can show targeted copy):
 *   - no_pending          : no in-flight code for this phone
 *   - expired             : code TTL passed
 *   - wrong_user          : a different signed-in user is trying to confirm
 *   - too_many_attempts   : 5 wrong tries already
 *   - mismatch            : the code typed doesn't match
 *   - table_missing       : 503 with migration hint
 */

interface ConfirmBody {
    phone?: unknown;
    code?: unknown;
}

const E164_RE = /^\+[1-9]\d{6,14}$/;
const CODE_RE = /^\d{6}$/;

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

function reasonToHint(r: ConfirmReason): string {
    switch (r) {
        case 'no_pending': return 'No verification in flight for this phone. Hit /start first.';
        case 'expired': return 'The code expired. Request a new one from /start.';
        case 'wrong_user': return 'Sign in with the same account that started the verification.';
        case 'too_many_attempts': return 'Too many wrong attempts. Request a new code from /start.';
        case 'mismatch': return 'That code does not match. Check iMessage and retry.';
        case 'table_missing': return 'Run lib/photon-imessage-users-migration.sql against your Supabase project.';
    }
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'integrations.imessage.confirm');
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

        const body = (await request.json().catch(() => null)) as ConfirmBody | null;
        const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
        const code = typeof body?.code === 'string' ? body.code.trim() : '';
        if (!phone || !E164_RE.test(phone)) {
            return NextResponse.json(
                {
                    error: 'invalid_phone',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Send phone in E.164 format, e.g. "+15551234567".',
                },
                { status: 400, headers: meta.headers },
            );
        }
        if (!CODE_RE.test(code)) {
            return NextResponse.json(
                {
                    error: 'invalid_code',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Send a 6-digit numeric code.',
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

        const result = await confirmCode(supabase, phone, code, verified.userId, meta.requestId);
        if (!result.ok) {
            const status = result.reason === 'table_missing' ? 503 : 401;
            return NextResponse.json(
                {
                    error: result.reason,
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: reasonToHint(result.reason),
                },
                { status, headers: meta.headers },
            );
        }

        const upsert = await upsertVerifiedUser(supabase, phone, verified.userId, meta.requestId);
        if (!upsert.ok) {
            return NextResponse.json(
                {
                    error: upsert.tableMissing ? 'users_table_missing' : 'upsert_failed',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    detail: upsert.error?.slice(0, 240),
                    nextAction: upsert.tableMissing
                        ? 'Run lib/photon-imessage-users-migration.sql against your Supabase project.'
                        : 'Inspect Supabase logs for write errors.',
                },
                { status: upsert.tableMissing ? 503 : 500, headers: meta.headers },
            );
        }

        safeLog({
            at: meta.route,
            event: 'verified',
            requestId: meta.requestId,
            phoneSuffix: phone.slice(-4),
            privyUser: verified.userId.slice(0, 12),
        });

        return NextResponse.json(
            {
                ok: true,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                phone,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

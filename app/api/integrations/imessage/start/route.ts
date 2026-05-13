import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { issueCode } from '@/lib/photon/verify-codes';
import { getPhotonAdapter } from '@/lib/photon/adapter';
import { safeLog, safeWarn } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/**
 * POST /api/integrations/imessage/start
 *
 * Body: { phone: string }   E.164 phone, e.g. "+15551234567"
 *
 * Auth: signed-in via Privy session token.
 *
 * Generates a 6-digit code, stores its hash + 10-min expiry in
 * imessage_verifications, and texts the plaintext code via the
 * Photon adapter. The user enters the code at /confirm to link
 * their phone to their Privy account.
 *
 * Honest-status: if Photon adapter is unconfigured we surface a
 * 503 with action_required rather than pretending the text went out.
 * If imessage_verifications doesn't exist we surface a 503 with the
 * migration filename.
 */

interface StartBody {
    phone?: unknown;
}

const E164_RE = /^\+[1-9]\d{6,14}$/;

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'integrations.imessage.start');
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

        const body = (await request.json().catch(() => null)) as StartBody | null;
        const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
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

        const adapter = getPhotonAdapter();
        if (!adapter.isActive()) {
            return NextResponse.json(
                {
                    error: 'photon_not_configured',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Set PHOTON_PROJECT_ID + PHOTON_API_KEY in Vercel env, then retry.',
                },
                { status: 503, headers: meta.headers },
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

        const issue = await issueCode(supabase, phone, verified.userId, meta.requestId);
        if (!issue.ok || !issue.code) {
            return NextResponse.json(
                {
                    error: issue.tableMissing ? 'verifications_table_missing' : 'issue_failed',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: issue.tableMissing
                        ? 'Run lib/photon-imessage-users-migration.sql against your Supabase project.'
                        : 'Inspect Supabase logs for write errors.',
                },
                { status: issue.tableMissing ? 503 : 500, headers: meta.headers },
            );
        }

        const send = await adapter.send({
            to: phone,
            text: `Your Operator Uplift verification code is ${issue.code}. It expires in 10 minutes.`,
            platform: 'imessage',
        });
        if (!send.ok) {
            safeWarn({
                at: meta.route,
                event: 'send_failed',
                requestId: meta.requestId,
                reason: send.reason,
                message: send.message?.slice(0, 240),
            });
            return NextResponse.json(
                {
                    error: send.reason,
                    detail: send.message?.slice(0, 240),
                    providerStatus: send.providerStatus,
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'We could not deliver the verification code. Double-check the number is an iMessage-enabled iPhone, then try again. If it keeps failing, email support@operatoruplift.com.',
                },
                { status: 502, headers: meta.headers },
            );
        }

        safeLog({
            at: meta.route,
            event: 'code_sent',
            requestId: meta.requestId,
            phoneSuffix: phone.slice(-4),
            privyUser: verified.userId.slice(0, 12),
        });

        return NextResponse.json(
            {
                ok: true,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                nextAction: 'Check iMessage for a 6-digit code, then POST it to /api/integrations/imessage/confirm.',
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

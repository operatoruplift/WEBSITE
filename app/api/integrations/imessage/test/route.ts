import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta } from '@/lib/apiHelpers';
import { getPhotonAdapter } from '@/lib/photon/adapter';
import { safeWarn, safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * POST /api/integrations/imessage/test
 *
 * Body: { phone?: string }   // optional E.164. If omitted, sends to
 *                           //   the FIRST verified phone for the
 *                           //   signed-in user.
 *
 * Auth: signed-in via Privy session token. The phone (or implied
 * default phone) must be bound to this Privy account, otherwise we
 * 403 the request to prevent using the bot's number to text strangers.
 *
 * Sends a fixed test message via Photon Spectrum so the user can
 * verify the OUTBOUND path (bot's number is correctly configured,
 * Spectrum API key works, the user's iPhone is on the conversation).
 *
 * Honest-status:
 *   - 401 reauth_required when Privy token is missing.
 *   - 403 phone_not_bound when phone doesn't match a verified row
 *     owned by the caller.
 *   - 503 photon_not_configured when PHOTON_API_KEY is missing.
 *   - 502 send_failed when Spectrum returns non-2xx, with the
 *     adapter's typed `reason` in the body.
 *   - 200 with { sent: true, messageId } on success. messageId is
 *     real, never fabricated.
 */

interface TestBody {
    phone?: unknown;
}

const E164_RE = /^\+[1-9]\d{6,14}$/;
const TEST_TEXT = 'Test from operatoruplift.com/integrations. Reply to confirm the bot can hear you.';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'integrations.imessage.test');
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

        const body = (await request.json().catch(() => null)) as TestBody | null;
        const requestedPhone = typeof body?.phone === 'string' ? body.phone.trim() : '';
        if (requestedPhone && !E164_RE.test(requestedPhone)) {
            return NextResponse.json(
                {
                    error: 'invalid_phone',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Send phone in E.164 format, e.g. "+15551234567", or omit to use the default verified phone.',
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

        // Find a verified phone owned by this user. Always scope by
        // privy_user_id so we never text a phone owned by someone else.
        let lookup = supabase
            .from('imessage_users')
            .select('sender, verified_at')
            .eq('privy_user_id', verified.userId)
            .not('verified_at', 'is', null)
            .limit(1);
        if (requestedPhone) lookup = lookup.eq('sender', requestedPhone);

        const { data, error } = await lookup;

        if (error) {
            const tableMissing = /relation .* does not exist|Could not find the table/i.test(error.message || '');
            return NextResponse.json(
                {
                    error: tableMissing ? 'table_missing' : 'database_error',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: tableMissing
                        ? 'Run lib/photon-imessage-users-migration.sql against your Supabase project.'
                        : 'Check Supabase connectivity and retry.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const row = (data ?? [])[0] as { sender: string } | undefined;
        if (!row) {
            return NextResponse.json(
                {
                    error: 'phone_not_bound',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: requestedPhone
                        ? 'That phone is not bound to your account. Verify it first at /integrations.'
                        : 'Verify a phone first at /integrations before sending a test.',
                },
                { status: 403, headers: meta.headers },
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
                    nextAction: 'Set PHOTON_PROJECT_ID + PHOTON_API_KEY in Vercel env.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const send = await adapter.send({
            to: row.sender,
            text: TEST_TEXT,
            platform: 'imessage',
        });
        if (!send.ok) {
            safeWarn({
                at: meta.route,
                event: 'test_send_failed',
                requestId: meta.requestId,
                reason: send.reason,
                message: send.message?.slice(0, 240),
            });
            return NextResponse.json(
                {
                    error: 'send_failed',
                    reason: send.reason,
                    detail: send.message?.slice(0, 240),
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Could not deliver the test message. Confirm the number is still an iMessage-enabled iPhone, then try again.',
                },
                { status: 502, headers: meta.headers },
            );
        }

        safeLog({
            at: meta.route,
            event: 'test_sent',
            requestId: meta.requestId,
            messageId: send.messageId,
        });

        return NextResponse.json(
            {
                sent: true,
                messageId: send.messageId,
                phone: row.sender,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 200, headers: meta.headers },
        );
    } catch (err) {
        safeWarn({
            at: meta.route,
            event: 'test_unexpected',
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

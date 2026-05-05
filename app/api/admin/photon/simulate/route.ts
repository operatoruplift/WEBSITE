import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { verifySession, getUserEmail } from '@/lib/auth';
import { isEmailBypassed, isUserIdBypassed } from '@/lib/subscription';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

/**
 * POST /api/admin/photon/simulate
 *
 * Admin-gated webhook simulator. Builds a synthetic Spectrum
 * payload, signs it with the configured PHOTON_WEBHOOK_SECRET, and
 * POSTs it back at the real /api/webhooks/photon route, returning
 * the webhook response verbatim. Lets operators verify the iMessage
 * agent end-to-end (signature check, idempotency, agent reply,
 * Photon adapter call, Supabase write) without involving Spectrum
 * or a real iPhone.
 *
 * Auth: same gate as the other /api/admin/photon/* routes.
 *
 * Body:
 *   {
 *     sender:   string  required (E.164 phone or any identifier)
 *     text:     string  required
 *     platform: 'imessage' | 'telegram' | 'whatsapp' | 'x' | 'discord' | 'instagram'  default 'imessage'
 *   }
 *
 * Response:
 *   {
 *     requestId, timestamp,
 *     webhook: { status, body, requestId } // mirrors what Spectrum would see
 *   }
 *
 * Notes:
 *   - The simulator inherits the project's PHOTON_WEBHOOK_SECRET, so
 *     the signature check inside the webhook actually runs the same
 *     validation as a real Spectrum delivery.
 *   - Each call uses a unique synthetic provider_message_id so
 *     idempotent insert never collides with real inbound traffic.
 *   - Honest-status: never marks the simulated row as something
 *     other than what came back. The webhook's reply is returned
 *     verbatim.
 */

interface SimulatePayload {
    sender?: unknown;
    text?: unknown;
    platform?: unknown;
}

const VALID_PLATFORMS = new Set(['imessage', 'telegram', 'whatsapp', 'x', 'discord', 'instagram']);

function bodyText(unknownVal: unknown): string | null {
    return typeof unknownVal === 'string' && unknownVal.trim().length > 0 ? unknownVal : null;
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'admin.photon.simulate');

    try {
        const debugKey = request.headers.get('x-debug-key');
        const adminKey = process.env.DEBUG_ADMIN_KEY;

        let sessionEmail: string | null = null;
        let privyUserId: string | null = null;
        try {
            const verified = await verifySession(request);
            privyUserId = verified.userId;
            sessionEmail = await getUserEmail(verified.userId);
        } catch { /* non-admin path falls through to 403 */ }

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

        const incoming = (await request.json().catch(() => null)) as SimulatePayload | null;
        if (!incoming) {
            return NextResponse.json(
                { error: 'invalid_json', requestId: meta.requestId, timestamp: meta.startedAt },
                { status: 400, headers: meta.headers },
            );
        }
        const sender = bodyText(incoming.sender);
        const text = bodyText(incoming.text);
        if (!sender || !text) {
            return NextResponse.json(
                {
                    error: 'missing_fields',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Send sender and text in the JSON body.',
                },
                { status: 400, headers: meta.headers },
            );
        }
        const platformRaw = typeof incoming.platform === 'string' ? incoming.platform : 'imessage';
        const platform = VALID_PLATFORMS.has(platformRaw) ? platformRaw : 'imessage';

        const fakePayload = {
            sender,
            text,
            platform,
            event_type: 'message',
            message_id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            received_via: 'admin_simulator',
            simulated_request_id: meta.requestId,
        };
        const fakeBody = JSON.stringify(fakePayload);

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const secret = process.env.PHOTON_WEBHOOK_SECRET?.trim();
        if (secret) {
            const sig = createHmac('sha256', secret).update(fakeBody).digest('hex');
            headers['X-Photon-Signature'] = `sha256=${sig}`;
        }

        const url = new URL(request.url);
        const webhookUrl = `${url.protocol}//${url.host}/api/webhooks/photon`;

        const started = Date.now();
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: fakeBody,
            signal: AbortSignal.timeout(18_000),
        });
        const elapsedMs = Date.now() - started;
        const respBody = await res.text();
        let parsed: unknown;
        try { parsed = JSON.parse(respBody); } catch { parsed = respBody.slice(0, 2000); }

        safeLog({
            at: meta.route,
            event: 'simulated',
            requestId: meta.requestId,
            sender,
            platform,
            textLen: text.length,
            webhookStatus: res.status,
            elapsedMs,
        });

        return NextResponse.json(
            {
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                webhook: {
                    status: res.status,
                    body: parsed,
                    requestId: res.headers.get('x-request-id'),
                    elapsedMs,
                },
                payload: {
                    sender,
                    platform,
                    textLen: text.length,
                    signed: Boolean(secret),
                },
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

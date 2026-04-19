import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getUserEmail } from '@/lib/auth';
import { isEmailBypassed, isUserIdBypassed } from '@/lib/subscription';
import { getPhotonAdapter, photonStatus } from '@/lib/photon/adapter';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/photon/imessage/send — admin-only for now.
 *
 * Wraps lib/photon/adapter so the transport can be exercised
 * independently of the agent pipeline. Used by /dev/imessage to
 * prove outbound works before wiring the LLM in.
 *
 * Body:
 *   { to: string          — E.164 or handle
 *     text: string
 *     platform?: 'imessage' | 'telegram' | 'whatsapp' | 'x' | 'discord' | 'instagram'
 *     threadId?: string   — stored on the outbound row so replies group correctly
 *     source?: 'agent' | 'dev_harness'  — logged, not exposed to provider
 *   }
 *
 * Persists an `outbound_messages` row with status:'pending' before the
 * send, then updates to 'sent' | 'failed' | 'not_configured' with the
 * provider's message id. Every response carries X-Request-Id.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'photon.imessage.send');
    try {
        // Admin-only. Matches /api/whoami + /api/dev/reliability/timeout gating.
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            return errorResponse(authErr, meta, { httpHint: 401 });
        }
        const sessionEmail = await getUserEmail(verified.userId);
        const isAdmin = (sessionEmail && isEmailBypassed(sessionEmail)) || isUserIdBypassed(verified.userId);
        if (!isAdmin) {
            return NextResponse.json(
                {
                    error: 'forbidden',
                    errorClass: 'reauth_required',
                    reason: 'not_admin',
                    recovery: 'none',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    message: 'Photon send is admin-gated during the transport-loopback phase.',
                    nextAction: 'Use /chat for normal messaging. Contact ops to be added to the admin allowlist.',
                },
                { status: 403, headers: meta.headers },
            );
        }

        const body = await request.json().catch(() => ({})) as Record<string, unknown>;
        const to = typeof body.to === 'string' ? body.to.trim() : '';
        const text = typeof body.text === 'string' ? body.text : '';
        const threadId = typeof body.threadId === 'string' ? body.threadId : undefined;
        const source = body.source === 'agent' || body.source === 'dev_harness' ? body.source : 'dev_harness';
        const platform = typeof body.platform === 'string' ? body.platform : 'imessage';

        if (!to) return validationError('`to` (E.164 phone or Spectrum handle) is required.', 'Include a recipient and retry.', meta);
        if (!text) return validationError('`text` is required and must be non-empty.', 'Include the message body and retry.', meta);

        const adapter = getPhotonAdapter();
        if (!adapter.isActive()) {
            const status = photonStatus();
            console.log(JSON.stringify({
                at: meta.route, event: 'not-configured', requestId: meta.requestId, ts: meta.startedAt,
                base: status.base, path: status.path, projectIdPresent: Boolean(status.projectId),
            }));
            // Log a 'not_configured' outbound row so the harness can see it.
            await persistOutbound({
                recipient: to, threadId, text, status: 'not_configured',
                failureReason: status.reason, requestId: meta.requestId, source, platform,
            });
            return NextResponse.json(
                {
                    error: 'photon_not_configured',
                    errorClass: 'provider_unavailable',
                    reason: 'not_configured',
                    recovery: 'retry',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    message: 'Photon Spectrum adapter is not configured on this deploy.',
                    nextAction: 'Set PHOTON_PROJECT_ID and PHOTON_API_KEY in Vercel env from the Spectrum Settings tab.',
                    details: { base: status.base, path: status.path },
                },
                { status: 503, headers: meta.headers },
            );
        }

        // Persist a pending row first so a crash between send + DB still
        // leaves breadcrumbs in the harness.
        const outboundId = await persistOutbound({
            recipient: to, threadId, text, status: 'pending',
            requestId: meta.requestId, source, platform,
        });

        const result = await adapter.send({
            to, text,
            platform: platform as 'imessage' | 'telegram' | 'whatsapp' | 'x' | 'discord' | 'instagram',
        });

        if (!result.ok) {
            console.log(JSON.stringify({
                at: meta.route, event: 'send-failed', requestId: meta.requestId, ts: meta.startedAt,
                reason: result.reason, providerStatus: result.providerStatus,
                detail: result.message.slice(0, 240),
            }));
            await updateOutbound(outboundId, { status: 'failed', failureReason: `${result.reason}: ${result.message.slice(0, 200)}` });
            return NextResponse.json(
                {
                    error: result.reason,
                    errorClass: 'provider_unavailable',
                    reason: result.reason,
                    recovery: 'retry',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    message: 'Photon rejected the message.',
                    nextAction: result.reason === 'network_error'
                        ? 'Retry in a moment; PHOTON_API_BASE may be unreachable.'
                        : 'Check the Photon Spectrum dashboard — recipient may be invalid or rate-limited.',
                    details: { detail: result.message.slice(0, 240), providerStatus: result.providerStatus },
                },
                { status: 502, headers: meta.headers },
            );
        }

        await updateOutbound(outboundId, { status: 'sent', photonMessageId: result.messageId });
        console.log(JSON.stringify({
            at: meta.route, event: 'sent', requestId: meta.requestId, ts: meta.startedAt,
            photonMessageId: result.messageId, threadId, source,
        }));

        return NextResponse.json(
            {
                ok: true,
                status: 'sent',
                photonMessageId: result.messageId,
                threadId,
                platform: result.platform,
                submittedAt: result.submittedAt,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

// ------------- Supabase helpers (no-op when not configured) -------------

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

interface OutboundRow {
    recipient: string;
    threadId?: string;
    text: string;
    status: 'pending' | 'sent' | 'failed' | 'not_configured';
    failureReason?: string;
    requestId: string;
    source: 'agent' | 'dev_harness';
    platform: string;
}

async function persistOutbound(r: OutboundRow): Promise<string | null> {
    const s = getSupabase();
    if (!s) return null;
    const { data, error } = await s
        .from('outbound_messages')
        .insert({
            provider: 'photon',
            platform: r.platform,
            recipient: r.recipient,
            thread_id: r.threadId ?? null,
            text: r.text,
            status: r.status,
            failure_reason: r.failureReason ?? null,
            sent_at: new Date().toISOString(),
            request_id: r.requestId,
            source: r.source,
        })
        .select('id')
        .single();
    if (error) {
        console.warn('[photon.send] outbound insert failed:', error.message);
        return null;
    }
    return (data?.id as string) || null;
}

async function updateOutbound(id: string | null, patch: { status?: string; failureReason?: string; photonMessageId?: string }) {
    if (!id) return;
    const s = getSupabase();
    if (!s) return;
    const update: Record<string, unknown> = {};
    if (patch.status) update.status = patch.status;
    if (patch.failureReason !== undefined) update.failure_reason = patch.failureReason;
    if (patch.photonMessageId) update.photon_message_id = patch.photonMessageId;
    const { error } = await s.from('outbound_messages').update(update).eq('id', id);
    if (error) console.warn('[photon.send] outbound update failed:', error.message);
}

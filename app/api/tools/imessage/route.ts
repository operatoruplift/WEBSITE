import { NextResponse } from 'next/server';
import { getCapabilities } from '@/lib/capabilities';
import { getPhotonAdapter } from '@/lib/photon/adapter';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 20;

/**
 * POST /api/tools/imessage
 * Body: { action: 'send', params: { to: string, text: string, html?: string, subject?: string } }
 *
 * iMessage send via the Photon adapter (see lib/photon/adapter.ts).
 * Tier 2 tool, requires a connected Photon account + the user to be
 * authenticated. Demo-mode never reaches this route; unauthenticated
 * callers get 403 from the capability guard below.
 *
 * Honest status rule (same as MagicBlock): if the Photon adapter
 * reports itself inactive, return 503 with action_required rather
 * than silently pretending the message went out. No fake receipts.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'tools.imessage');
    try {
        const caps = await getCapabilities(request);
        if (!caps.capability_real || !caps.userId) {
            return NextResponse.json(
                { error: 'demo_mode', simulated: true, message: 'Sign in to send real iMessage.', requestId: meta.requestId },
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
                    action_required: 'Set PHOTON_API_KEY and PHOTON_PROJECT_ID in Vercel env. If your provider uses a different base URL or send path, also set PHOTON_API_BASE and PHOTON_SEND_PATH.',
                    nextAction: 'Wait for Photon to be configured. Try again later.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const { action, params } = (await request.json()) as {
            action?: string;
            params?: { to?: string; text?: string; html?: string; subject?: string; attachments?: string[] };
        };

        if (action !== 'send') {
            return validationError(`unknown_action:${action}. Supported: send`, 'Use action="send".', meta, { action });
        }

        if (!params?.to || !params?.text) {
            return validationError('to and text required', 'Send both params.to and params.text in the JSON body.', meta, {
                missing: [!params?.to && 'to', !params?.text && 'text'].filter(Boolean),
            });
        }

        const result = await adapter.send({
            to: params.to,
            text: params.text,
            html: params.html,
            subject: params.subject,
            attachments: params.attachments,
        });

        if (!result.ok) {
            return NextResponse.json(
                { error: result.reason, message: result.message, providerStatus: result.providerStatus, requestId: meta.requestId },
                { status: result.reason === 'not_configured' ? 503 : 502, headers: meta.headers },
            );
        }

        return NextResponse.json({
            action: 'send',
            sent: {
                messageId: result.messageId,
                provider: result.provider,
                platform: result.platform,
                submittedAt: result.submittedAt,
            },
        }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

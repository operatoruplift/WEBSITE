import { NextResponse } from 'next/server';
import { getCapabilities } from '@/lib/capabilities';
import { getPhotonAdapter } from '@/lib/photon/adapter';

export const runtime = 'nodejs';
export const maxDuration = 20;

/**
 * POST /api/tools/imessage
 * Body: { action: 'send', params: { to: string, text: string, html?: string, subject?: string } }
 *
 * iMessage send via the Photon adapter (see lib/photon/adapter.ts).
 * Tier 2 tool — requires a connected Photon account + the user to be
 * authenticated. Demo-mode never reaches this route; unauthenticated
 * callers get 403 from the capability guard below.
 *
 * Honest status rule (same as MagicBlock): if the Photon adapter
 * reports itself inactive, return 503 with action_required rather
 * than silently pretending the message went out. No fake receipts.
 */
export async function POST(request: Request) {
    const caps = await getCapabilities(request);
    if (!caps.capability_real || !caps.userId) {
        return NextResponse.json(
            { error: 'demo_mode', simulated: true, message: 'Sign in to send real iMessage.' },
            { status: 403 },
        );
    }

    const adapter = getPhotonAdapter();
    if (!adapter.isActive()) {
        return NextResponse.json(
            {
                error: 'photon_not_configured',
                action_required: 'Set PHOTON_API_KEY and PHOTON_PROJECT_ID in Vercel env. If your provider uses a different base URL or send path, also set PHOTON_API_BASE and PHOTON_SEND_PATH.',
            },
            { status: 503 },
        );
    }

    const { action, params } = (await request.json()) as {
        action?: string;
        params?: { to?: string; text?: string; html?: string; subject?: string; attachments?: string[] };
    };

    if (action !== 'send') {
        return NextResponse.json(
            { error: `unknown_action:${action}. Supported: send` },
            { status: 400 },
        );
    }

    if (!params?.to || !params?.text) {
        return NextResponse.json(
            { error: 'to and text required' },
            { status: 400 },
        );
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
            { error: result.reason, message: result.message, providerStatus: result.providerStatus },
            { status: result.reason === 'not_configured' ? 503 : 502 },
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
    });
}

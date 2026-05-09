import { NextResponse } from 'next/server';
import { withRequestMeta } from '@/lib/apiHelpers';
import { photonStatus } from '@/lib/photon/adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health/imessage
 *
 * Sanitized status for the iMessage agent so the IMessageVerifyCard
 * on /integrations can render a status pill before the user clicks
 * "Send test." Returns one of three states:
 *
 *   operational  Photon adapter active + ANTHROPIC_API_KEY present.
 *                Bot will reply with Claude Haiku.
 *   degraded     Photon adapter active but no LLM key. Bot replies
 *                with the canned "Got it, working on it." fallback.
 *                Useful but limited.
 *   down         Photon adapter inactive. Bot can't reply at all
 *                because PHOTON_PROJECT_ID or PHOTON_API_KEY is
 *                missing.
 *
 * Public-allowlisted via the existing `/api/health` middleware prefix
 * (middleware.ts:43 matches with startsWith), so anonymous uptime
 * probes work. The response deliberately leaks no env-var names so a
 * scanner can't fingerprint missing credentials. The detailed env-var
 * view lives at `/api/health/adapters`, which is admin-gated.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'health.imessage');

    const photon = photonStatus();
    const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

    const status: 'operational' | 'degraded' | 'down' = !photon.active
        ? 'down'
        : hasAnthropic
            ? 'operational'
            : 'degraded';

    return NextResponse.json(
        {
            ok: true,
            status,
            requestId: meta.requestId,
            timestamp: meta.startedAt,
        },
        { status: 200, headers: meta.headers },
    );
}

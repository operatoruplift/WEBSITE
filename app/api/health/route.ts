import { NextResponse } from 'next/server';
import { withRequestMeta } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Cheap probe for Vercel + external uptime monitors. Returns 200
 * with a minimal payload. No DB call, no LLM probe, no Photon
 * adapter reach-out, so a Supabase/Anthropic/Photon outage does NOT
 * cause an alert here. For deeper health, point monitors at:
 *
 *   GET /api/health/llm       - probes every configured LLM provider
 *   GET /api/health/adapters  - probes external adapters (Photon, etc.)
 *
 * The `/api/health` whitelist entry in middleware.ts predates this
 * route file. Fixes Wave 1 risk #6 ("whitelisted but does not exist,
 * uptime probes 404").
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'health');
    return NextResponse.json(
        {
            ok: true,
            service: 'operatoruplift-web',
            requestId: meta.requestId,
            timestamp: meta.startedAt,
        },
        { status: 200, headers: meta.headers },
    );
}

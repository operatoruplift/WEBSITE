import { NextResponse } from 'next/server';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { listAgents } from '@/lib/arkiv';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/arkiv/agents
 *
 * Lists every agent identity card published to Arkiv Braga testnet
 * under our PROJECT_ATTRIBUTE, filtered to entities created by the
 * trusted backend wallet. Public, no auth: judges can hit this from
 * any browser without signing in.
 *
 * Honest-status: returns an empty array when Arkiv is misconfigured
 * or no agents are published yet (hide-when-NULL contract, same
 * shape Filecoin/0G use on /security).
 *
 * The endpoint is the on-Arkiv companion to /agents/<slug>.json:
 * the static JSON ships an ERC-8004-style manifest with a checksum;
 * this endpoint exposes the on-Arkiv tamper-proof mirror so a judge
 * can cross-verify the two surfaces match.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'arkiv.agents.list');
    try {
        const agents = await listAgents();
        return NextResponse.json(
            {
                agents,
                count: agents.length,
                explorer: 'https://explorer.braga.hoodi.arkiv.network/',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta, { errorClass: 'provider_unavailable' });
    }
}

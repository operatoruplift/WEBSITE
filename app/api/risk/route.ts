import { NextResponse } from 'next/server';
import { withRequestMeta } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

/**
 * /api/risk used to call lib/webacy-risk.ts which returned hardcoded
 * "demo" risk grades (overall: 87, grade: 'A', flagged: false). That's
 * fabrication. Agents and users would see a "your wallet is safe"
 * answer regardless of the actual wallet, contract, or transaction.
 *
 * No internal callers; the lib has been deleted. The route returns
 * 410 Gone so any stale caller gets a clear "not implemented" signal.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'risk');
    return NextResponse.json({
        error: 'gone',
        errorClass: 'unknown',
        requestId: meta.requestId,
        timestamp: meta.startedAt,
        message: 'Risk scoring is not yet integrated. The previous endpoint returned fabricated demo grades and has been retired.',
        nextAction: 'Wait for the DD.xyz integration to be wired up, or check /docs for the integration roadmap.',
    }, { status: 410, headers: meta.headers });
}

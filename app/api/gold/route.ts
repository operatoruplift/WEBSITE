import { NextResponse } from 'next/server';
import { withRequestMeta } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

/**
 * /api/gold used to call lib/oro-grail.ts which returned hardcoded
 * "demo" gold balances (balanceOz: 0.0847, balanceUsd: 278.24, etc).
 * Those exact values are banned by tests/e2e/dashboard-honesty.spec.ts
 * because the Gold Agent widget was retired in #164. But the API
 * route + lib survived and continued serving fabricated data to anyone
 * who hit it directly.
 *
 * No internal callers; the lib has been deleted. The route returns
 * 410 Gone so any stale caller gets a clear "not implemented" signal.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'gold');
    return NextResponse.json({
        error: 'gone',
        errorClass: 'unknown',
        requestId: meta.requestId,
        timestamp: meta.startedAt,
        message: 'Gold-backed asset reporting is not yet integrated. The previous endpoint returned fabricated demo balances and has been retired.',
        nextAction: 'Wait for the Oro GRAIL integration to be wired up. The integration is listed as coming_soon on /integrations.',
    }, { status: 410, headers: meta.headers });
}

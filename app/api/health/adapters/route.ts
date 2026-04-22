import { NextResponse } from 'next/server';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { getCapabilities } from '@/lib/capabilities';
import { photonStatus } from '@/lib/photon/adapter';
import { magicBlockSurfaceStatus } from '@/lib/magicblock/adapter';
import { paymentsEnabled } from '@/lib/magicblock/payments';

export const runtime = 'nodejs';

/**
 * GET /api/health/adapters
 *
 * Operational view of which external adapters are wired and which
 * aren't. Validates Pattern 10 (honest-status rule) from a single
 * surface — so ops can curl one endpoint and see which env vars are
 * missing, rather than probing tool routes one by one and reading
 * their 503 responses.
 *
 * Authenticated-only. Anonymous = 401 to avoid leaking configuration
 * posture to scanners. The information isn't strictly secret (an
 * end user with real execution would see the same posture via tool
 * calls) but health endpoints that list missing credentials are a
 * well-known scanner target.
 *
 * Response shape (200):
 *   {
 *     requestId, timestamp,
 *     adapters: [
 *       { name, active, reason, details? },
 *       ...
 *     ]
 *   }
 *
 * Each adapter entry is honest about its active state. The `details`
 * block carries non-sensitive config (base URL, path, flag value) so
 * ops can read it without SSHing into the Vercel project. Secrets
 * (API keys, tokens, private keys) NEVER appear in the response.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'health.adapters');
    try {
        const caps = await getCapabilities(request);
        if (!caps.userId) {
            return NextResponse.json(
                {
                    error: 'unauthorized',
                    errorClass: 'reauth_required',
                    reason: 'not_authenticated',
                    recovery: 'reauth',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    message: 'Sign in to view adapter status.',
                    nextAction: 'Sign in with Privy and retry.',
                },
                { status: 401, headers: meta.headers },
            );
        }

        const photon = photonStatus();
        const mbEr = magicBlockSurfaceStatus();
        const mbPaymentsActive = paymentsEnabled();

        const adapters = [
            {
                name: 'photon',
                active: photon.active,
                reason: photon.reason,
                details: {
                    base: photon.base,
                    path: photon.path,
                    projectIdConfigured: Boolean(photon.projectId),
                },
            },
            {
                name: 'magicblock_er',
                active: mbEr.active,
                reason: mbEr.reason,
                details: { rpcUrl: mbEr.rpcUrl },
            },
            {
                name: 'magicblock_payments',
                active: mbPaymentsActive,
                reason: mbPaymentsActive
                    ? 'MAGICBLOCK_PAYMENTS_ENABLED=1 and MAGICBLOCK_PAYMENTS_TOKEN present.'
                    : 'Needs MAGICBLOCK_PAYMENTS_ENABLED=1 and MAGICBLOCK_PAYMENTS_TOKEN in Vercel env.',
            },
        ];

        return NextResponse.json(
            {
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                adapters,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

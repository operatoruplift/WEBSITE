import { NextResponse } from 'next/server';
import { resolveSolDomain, mockSolDomain } from '@/lib/sns';
import { getCapabilities } from '@/lib/capabilities';
import { withRequestMeta, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 10;

/**
 * GET /api/sns/resolve?name=operatoruplift.sol
 *
 * Resolves a `.sol` domain via the Bonfida SNS proxy and returns the
 * owner + records + verified flag. Cached 10 min per name. Demo-mode
 * callers (anonymous, or authenticated without capability_real) get a
 * mocked response with `simulated: true` so the Profile identity card
 * never throws on cold load.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'sns.resolve');
    const name = new URL(request.url).searchParams.get('name');
    if (!name) {
        return validationError('name required', 'Pass ?name=<domain> in the query string.', meta, {
            missing: ['name'],
        });
    }

    const caps = await getCapabilities(request);
    const payload = caps.capability_real
        ? await resolveSolDomain(name)
        : mockSolDomain(name);

    return NextResponse.json(payload, {
        headers: {
            // SNS is cheap but the Bonfida proxy can flake, allow the
            // CDN to cache for a minute so cold loads don't stampede.
            'Cache-Control': 'public, max-age=60, s-maxage=60',
            ...meta.headers,
        },
    });
}

import { NextResponse } from 'next/server';
import { totalCount, founderCount } from '@/lib/waitlist';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/waitlist/counts
 *
 * Public, no-auth read of the waitlist count split into
 * { total, founder }. The /waitlist page hits this on mount so
 * the Founder Member card can render social proof ("38 founders
 * signed up") without forcing the visitor to submit the form first.
 *
 * Why a separate route from POST /api/waitlist:
 *   - Counts are interesting before the user opts in, not just after
 *   - Polling counts to drive a live counter doesn't require POST
 *   - Keeps the POST response shape stable (existing UI relies on it)
 *
 * No trust gate; both counts are inherently public-facing (we're
 * trying to show them to anyone). withRequestMeta still wraps the
 * response for the X-Request-Id contract.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'waitlist.counts');
    try {
        const [total, founder] = await Promise.all([
            totalCount(),
            founderCount(),
        ]);
        return NextResponse.json(
            {
                total,
                founder,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

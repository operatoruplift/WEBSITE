import { NextResponse } from 'next/server';
import { totalCount, founderCount } from '@/lib/waitlist';
import { withRequestMeta } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/waitlist/counts
 *
 * Public, no-auth read of the waitlist count split into
 * { total, founder }. The /waitlist page and the homepage hero
 * social-proof pill both hit this on mount.
 *
 * Failure mode: returns 200 with {total:0, founder:0} when Supabase
 * is unconfigured (CI, preview without secrets) or unreachable.
 * The hero pill and /waitlist counts pill are both gated on
 * total > 0, so an honest empty state hides them entirely instead
 * of producing a console error ("Failed to load resource: 503...").
 * The console-cleanliness regression spec on `/` depends on this.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'waitlist.counts');
    let total = 0;
    let founder = 0;
    try {
        [total, founder] = await Promise.all([
            totalCount(),
            founderCount(),
        ]);
    } catch {
        // Honest empty state: counts default to 0. Callers gate on
        // total > 0 so the UI silently hides the pill.
    }
    return NextResponse.json(
        {
            total,
            founder,
            requestId: meta.requestId,
            timestamp: meta.startedAt,
        },
        { headers: meta.headers },
    );
}

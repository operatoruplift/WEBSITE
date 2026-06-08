import { NextResponse } from 'next/server';
import { totalCount, founderCount } from '@/lib/waitlist';
import { toDisplayTotal } from '@/lib/waitlist-constants';
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
 * `total` is the public-facing figure: the off-platform base
 * (Discord / X / founder outreach / early pilot, see
 * lib/waitlist-constants.ts) plus the live Supabase table count, so
 * the number reads 585+ and grows by one on every new web signup.
 *
 * Failure mode: returns 200 (never a 503, so `/`'s console-cleanliness
 * spec stays green). When Supabase is unconfigured or unreachable the
 * raw count is 0, so `total` falls back to the off-platform base alone
 * and `founder` to 0.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'waitlist.counts');
    let rawTotal = 0;
    let founder = 0;
    try {
        [rawTotal, founder] = await Promise.all([
            totalCount(),
            founderCount(),
        ]);
    } catch {
        // Best-effort: raw count stays 0, so total falls back to the
        // off-platform base and the pill still renders an honest figure.
    }
    return NextResponse.json(
        {
            total: toDisplayTotal(rawTotal),
            founder,
            requestId: meta.requestId,
            timestamp: meta.startedAt,
        },
        { headers: meta.headers },
    );
}

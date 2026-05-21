import { NextResponse } from 'next/server';
import { lookupByEmail, totalCount } from '@/lib/waitlist';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/waitlist/lookup?email=alice@example.com
 *
 * Returns the caller's current waitlist position so the /waitlist page
 * can render "You are #X of Y" without requiring a Privy session.
 *
 * Public read, no auth required (allowlisted in middleware). The risk
 * is email enumeration, mitigated three ways:
 *
 *  1. The response shape is identical whether the email is on the list
 *     or not (position is `null` when missing, never a 404).
 *  2. The route only returns position + count, never email-correlated
 *     metadata like created_at or wallet_address.
 *  3. Operator-side: rate limiting at the Vercel edge once we wire it.
 *
 * Note this does NOT enroll a missing email. The /api/waitlist POST
 * is the only path that creates a row, so this stays read-only.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'waitlist.lookup');
    try {
        const url = new URL(request.url);
        const email = url.searchParams.get('email');

        if (!email || !email.includes('@')) {
            return validationError(
                'email required',
                'Pass ?email=<address> in the query string.',
                meta,
                { missing: !email ? ['email'] : ['email_format'] },
            );
        }

        const [row, count] = await Promise.all([
            lookupByEmail(email),
            totalCount(),
        ]);

        return NextResponse.json(
            {
                position: row?.position ?? null,
                onWaitlist: Boolean(row),
                count,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}
